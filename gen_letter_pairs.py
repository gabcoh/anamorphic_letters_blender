from math import pi
import argparse
import os

from mathutils import Vector
import bpy

OCTREE_DEPTH = 7

# Thanks https://caretdashcaret.com/2015/05/19/how-to-run-blender-headless-from-the-command-line-without-the-gui/
def get_args(list=None):
    parser = argparse.ArgumentParser()
 
    # get all script args
    _, all_arguments = parser.parse_known_args(list)
    double_dash_index = all_arguments.index('--')
    script_args = all_arguments[double_dash_index + 1: ]
 
    # add parser rules
    parser.add_argument('--front', help="front char", required=True)
    parser.add_argument('--right', help="right char", required=True)
    parser.add_argument('--save', help="file to save to", required=True)
    parser.add_argument('--font-path', help="path to fonts", required=True)
    parser.add_argument('--font-name', help="name of font", required=True)
    parser.add_argument('--glyph-width', help="width of glyph at default size in blender", required=True)


    parsed_script_args, _ = parser.parse_known_args(script_args)
    return parsed_script_args

def import_font(font_path):
    if {'FINISHED'} != bpy.ops.font.open(filepath=font_path):
        print("UNABLE TO LOAD FONT AT {}".format(font_path))
        return False
    return True

def main():
    list = "-b -P gen_letter_pairs.py -- --front Y --right E -s AB.gltf --font-path /home/gabe/code/anamorphic/B612_Mono --font-name B612Mono-BoldItalic --glyph-width 0.7 --save AA.glb".split(" ")
    
    args = get_args()
    #args = get_args(list)
    
    first_char = args.front
    second_char = args.right

    glyph_width = float(args.glyph_width)
    font_name   = args.font_name
    font_path   = os.path.join(args.font_path, font_name+".ttf")

    if len(first_char) != 1:
        print("Front char must be a single character")
    if len(second_char) != 1:
        print("Right char must be a single character")        
    
    print("Importing Font")
    if not import_font(font_path):
        return;
    
    print("Clearing Scene")
    for obj in bpy.data.objects:
      obj.select_set(True)
    bpy.ops.object.delete(use_global=False)
    
    print("Adding First Character")

    bpy.ops.object.text_add()
    first_tobj = bpy.context.object
    first_tobj.name = "First Char"
    
    first_tobj.data.body         = first_char
    first_tobj.rotation_euler[0] = pi/2
    first_tobj.data.extrude      = glyph_width/2
    first_tobj.data.font         = bpy.data.fonts[font_name]
    
    print("Creating Second Character from First")
    first_tobj.select_set(True)
    bpy.ops.object.duplicate()
    second_tobj = bpy.context.object
    second_tobj.name = "Second Char"
    
    second_tobj.rotation_euler[2] = pi/2
    second_tobj.data.body         = second_char
    
    print("Adjust positions")
    first_tobj.location[1]  += glyph_width/2
    second_tobj.location[0] += glyph_width/2 
    # For some reason for better results might need a slight perterbation
    second_tobj.location[2] += .000001
    second_tobj.location[1] += .000001
    second_tobj.location[0] += .000001
    
    print("Scaling Up")
    first_tobj.select_set(True)
    second_tobj.select_set(True)
    
    bpy.ops.transform.resize(value=(10, 10, 10))
    
    print("Voxelify")
    first_tobj.select_set(True)
    second_tobj.select_set(True)
    
    bpy.ops.object.convert(target="MESH")
    
    for obj in [first_tobj, second_tobj]:
        bpy.context.view_layer.objects.active = obj
        bpy.ops.object.modifier_add(type="REMESH")
        
        mod = obj.modifiers['Remesh']
        
        mod.octree_depth = OCTREE_DEPTH
        mod.mode         = 'BLOCKS'
        mod.scale        = .99
        
        bpy.ops.object.modifier_apply(modifier="Remesh")
    
    print("Intersection")
    bpy.context.view_layer.objects.active = first_tobj
    
    bpy.ops.object.modifier_add(type='BOOLEAN')
    mod = first_tobj.modifiers['Boolean']
    
    mod.object           = second_tobj
    mod.operation        = 'INTERSECT'
    mod.double_threshold = 0
       
    bpy.ops.object.modifier_apply(modifier="Boolean")

    print("Decimating")
    bpy.ops.object.modifier_add(type='DECIMATE')
    mod = first_tobj.modifiers['Decimate']
    
    mod.decimate_type = 'DISSOLVE'
    mod.angle_limit = pi*(1/180)
    
    bpy.ops.object.modifier_apply(modifier='Decimate')
    
    
    bpy.context.view_layer.objects.active = second_tobj
    first_tobj.select_set(False)
    bpy.ops.object.delete(use_global=False)
     
    print("Scaling Down")
    first_tobj.select_set(True)
    
    bpy.ops.transform.resize(value=(1/10, 1/10, 1/10))
    
    print("Adjust Position")
    first_tobj.location = Vector([0, 0, 0])
    
    print("Exporting to {}".format(args.save))
    bpy.ops.export_scene.gltf(filepath=args.save)
main()
