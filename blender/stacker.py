"""Reach stacker lifts the Balar container off the stack, turns it and the camera
zooms in (frames 1–150). Side view, transparent background, renders WebP frames.

  blender -b -P stacker.py -- --frames 40          (one test frame)
  blender -b -P stacker.py -- --frames 1-150 --samples 64
"""
import sys
import os
import math
import argparse
import bpy
from mathutils import Vector

sys.path.append(os.path.dirname(__file__))
import lib  # noqa: E402
from lib import box, cylinder, profile, arc, mat, wheel, container, empty, seg, lerp  # noqa: E402

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ap = argparse.ArgumentParser()
ap.add_argument('--frames', default='40')
ap.add_argument('--samples', type=int, default=96)
ap.add_argument('--res', default='1600x900')
ap.add_argument('--out', default=os.path.join(os.path.dirname(__file__), '..', 'seq', 'stacker'))
args = ap.parse_args(argv)
rx, ry = map(int, args.res.split('x'))

s = lib.reset(samples=args.samples, res=(rx, ry), transparent=True)
s.frame_start, s.frame_end = 1, 150

# ----------------------------------------------------------------------------- materials
paint = mat('stacker_blue', '#155a9c', metal=0.35, rough=0.32, coat=1.0, coat_rough=0.06)
paint_dark = mat('stacker_dark', '#22262c', metal=0.4, rough=0.42, coat=0.5)
boom_paint = mat('boom', '#2b3036', metal=0.45, rough=0.38, coat=0.8)
steel = mat('steel', '#c9ced6', metal=1.0, rough=0.18)
glass = mat('glass', '#1b2a36', metal=0.0, rough=0.02, transmission=0.85, coat=1.0)
seat = mat('seat', '#2a2a2a', rough=0.8)
yellow = mat('yellow', '#f2c230', rough=0.35, coat=0.8)
haz = lib.hazard()
lamp = mat('lamp', '#ffffff', emit='#fff4dc', emit_strength=6)
beacon_m = mat('beacon', '#ffb020', emit='#ff8a00', emit_strength=8)
white_txt = mat('white_txt', '#ffffff', rough=0.4)

# ----------------------------------------------------------------------------- reach stacker
rs = empty('stacker', (-4.5, 0, 0))

# lower chassis with wheel arches (dark)
chassis = [(-5.4, 0.75)] + arc(-2.9, 0.85, 1.12, 180, 0) + arc(3.0, 1.0, 1.28, 180, 0) + [(4.9, 1.0), (4.9, 1.85), (-5.4, 1.85)]
profile('chassis', chassis, 2.7, paint_dark, bevel=0.06, parent=rs)
# main blue body: sloped engine hood at the rear, low deck in front of the cab
body = [(-5.4, 1.7), (4.6, 1.7), (4.85, 2.2), (4.35, 2.6), (0.4, 2.6), (-0.4, 2.7), (-0.9, 4.25), (-1.3, 4.5), (-4.2, 4.55), (-5.1, 4.1), (-5.4, 3.4)]
profile('body', body, 2.6, paint, bevel=0.12, segments=5, parent=rs)
# counterweight with hazard band
profile('counterweight', [(-6.2, 0.95), (-5.3, 0.95), (-5.3, 3.4), (-5.75, 3.55), (-6.2, 3.0)], 2.95, paint_dark, bevel=0.08, parent=rs)
box('cw_hazard', (0.95, 3.0, 0.32), (-5.75, 0, 1.4), haz, bevel=0.02, parent=rs)
# engine grille, exhaust, tail and head lights
for i in range(6):
    box(f'grille{i}', (2.2, 0.04, 0.07), (-3.1, -1.36, 2.35 + i * 0.22), paint_dark, bevel=0.01, parent=rs)
cylinder('exhaust', 0.11, 1.2, (-2.1, 0.95, 5.05), steel, axis='Z', parent=rs, radius2=0.13)
box('taillight', (0.06, 0.4, 0.25), (-6.23, -1.1, 2.6), mat('tail', '#ff2a1a', emit='#ff2010', emit_strength=4), bevel=0.01, parent=rs)
box('headlight', (0.06, 0.42, 0.22), (4.88, -1.0, 2.0), lamp, bevel=0.01, parent=rs)
# BALAR lettering on the hood
lib.text('hood_logo', 'BALAR', 0.42, (-3.9, -1.33, 3.55), white_txt, parent=rs)

# cab (towards the camera side): base, glass greenhouse, roof, frame, seat, beacon, work lights
cab_y = -0.55
profile('cab_base', [(0.0, 2.6), (2.6, 2.6), (2.8, 2.9), (2.8, 3.1), (0.0, 3.1)], 1.9, paint, y=cab_y, bevel=0.06, parent=rs)
profile('cab_glass', [(0.08, 3.1), (2.7, 3.1), (3.0, 5.05), (2.75, 5.35), (0.15, 5.35), (-0.05, 5.1)], 1.8, glass, y=cab_y, bevel=0.04, parent=rs)
profile('cab_roof', [(-0.15, 5.3), (2.9, 5.3), (3.15, 5.55), (-0.05, 5.62)], 2.05, paint, y=cab_y, bevel=0.06, parent=rs)
for x, yy, tilt in ((0.0, -1.42, 0.0), (0.0, 0.32, 0.0), (2.83, -1.42, -0.15), (2.83, 0.32, -0.15)):
    p = box('pillar', (0.1, 0.1, 2.3), (x, yy, 4.22), paint_dark, bevel=0.015, parent=rs)
    p.rotation_euler = (0, tilt, 0)
box('seat', (0.8, 0.8, 0.9), (0.9, cab_y, 3.55), seat, bevel=0.08, parent=rs)
cylinder('wheel_steer', 0.28, 0.05, (2.0, cab_y, 3.85), paint_dark, axis='X', parent=rs).rotation_euler = (0, 1.1, 0)
cylinder('beacon', 0.14, 0.32, (1.1, cab_y, 5.8), beacon_m, axis='Z', parent=rs)
for x in (0.25, 2.6):
    box('worklight', (0.3, 0.22, 0.18), (x, -1.5, 5.62), lamp, bevel=0.02, parent=rs)
box('mirror', (0.05, 0.32, 0.5), (3.2, -1.65, 4.4), paint_dark, bevel=0.01, parent=rs)
for i, z in enumerate((1.05, 1.5)):
    box(f'step{i}', (0.6, 0.35, 0.06), (-0.3 + i * 0.12, -1.55, z), steel, bevel=0.01, parent=rs)
for x in (0.45, 1.3):
    cylinder('rail', 0.04, 0.8, (x, -1.25, 3.05), yellow, axis='Z', parent=rs)
cylinder('rail_top', 0.04, 1.0, (0.88, -1.25, 3.45), yellow, axis='X', parent=rs)

# wheels: twin drive wheels at the front, singles at the rear (yellow port rims)
for yy in (-1.0, -1.85, 1.0, 1.85):
    wheel(f'wf{yy}', 0.95, 0.72, '#f2c230', (3.0, yy, 0.95), parent=rs)
for yy in (-1.2, 1.2):
    wheel(f'wr{yy}', 0.8, 0.62, '#f2c230', (-2.9, yy, 0.8), parent=rs)

# boom: pivot on the hood, outer section + telescopic inner section + decal
PIVOT = Vector((-2.4, 0, 4.55))
boom = empty('boom', PIVOT, parent=rs)
box('boom_outer', (9.0, 1.0, 1.1), (4.5, 0, 0), boom_paint, bevel=0.06, segments=4, parent=boom)
box('boom_band', (5.4, 1.02, 0.14), (4.6, 0, 0.12), paint, bevel=0.01, parent=boom)
lib.text('boom_logo', 'BALAR OVERSEAS', 0.38, (1.6, -0.52, -0.33), white_txt, parent=boom)
inner = empty('boom_inner', (0, 0, 0), parent=boom)
box('boom_inner_mesh', (10.0, 0.78, 0.84), (5.0, 0, 0), boom_paint, bevel=0.05, parent=inner)
cylinder('pivot_pin', 0.45, 1.3, (0, 0, 0), steel, axis='Y', parent=boom)

# twin lift cylinders (barrel + chrome rod), aligned every frame
BASE = Vector((-0.6, 0, 2.6))
rams = []
for yy in (-0.62, 0.62):
    barrel = cylinder(f'ram_barrel{yy}', 0.27, 2.8, (0, 0, 0), paint, axis='Z', parent=rs)
    rod = cylinder(f'ram_rod{yy}', 0.14, 1.0, (0, 0, 0), steel, axis='Z', parent=rs)
    for o, L in ((barrel, 2.8), (rod, 1.0)):
        o.data.transform(__import__('mathutils').Matrix.Translation((0, 0, L / 2)))
        o.rotation_mode = 'QUATERNION'
    rams.append((barrel, rod, yy))

# spreader (headblock + rotator + beam + hazard ends + twistlocks); local X = beam length
sp = empty('spreader')
box('sp_beam', (12.0, 0.9, 0.5), (0, 0, 0.3), paint_dark, bevel=0.04, parent=sp)
for x in (-6.0, 6.0):
    box('sp_end', (0.6, 2.6, 0.62), (x, 0, 0.3), haz, bevel=0.03, parent=sp)
    for yy in (-1.15, 1.15):
        box('twistlock', (0.4, 0.3, 0.3), (x, yy, 0.0), steel, bevel=0.02, parent=sp)
for x in (-2.4, 2.4):
    box('sp_cross', (0.25, 2.3, 0.25), (x, 0, 0.3), paint_dark, bevel=0.02, parent=sp)
cylinder('rotator', 0.8, 0.5, (0, 0, 0.8), steel, axis='Z', parent=sp, radius2=0.7)
box('headblock', (1.7, 1.4, 0.9), (0, 0, 1.45), paint_dark, bevel=0.1, parent=sp)

# ----------------------------------------------------------------------------- containers
STACK_X = (7.6, 10.06)
container('stack_blue', '#1f3c8f', loc=(STACK_X[0], 0, 0)).rotation_euler = (0, 0, math.pi / 2)
container('stack_orange', '#d4632a', loc=(STACK_X[1], 0, 0)).rotation_euler = (0, 0, math.pi / 2)
hero = container('hero', '#b9bec5', label='BALAR OVERSEAS', label_color='#1e2328')

lib.studio_light(sun_dir=(-55, 0, -32), strength=1.1, sky_strength=0.07)   # soft fill + rim
lib.sun_toward((0.45, 0.55, -0.7), strength=2.2)                           # key light from the camera side
# dark ground like the reference: seen almost edge-on it reads as a black band
lib.shadow_floor()   # contact shadows only; the black ground band is drawn by the page (like the reference)

# ----------------------------------------------------------------------------- animation
START = Vector(((STACK_X[0] + STACK_X[1]) / 2, 0, 2.59))
LIFTED = Vector((4.6, 0, 7.6))


def pose(f):
    lift = seg(f, 15, 55)
    c = START.lerp(LIFTED, lift)
    c.z += math.sin(lift * math.pi) * 0.6               # slight arc while lifting
    return c, math.pi / 2                                 # container stays end-on; the camera moves


def apply(f):
    c, yaw = pose(f)
    hero.location = c
    hero.rotation_euler = (0, 0, yaw)
    sp.location = c + Vector((0, 0, 2.59 + 0.05))
    sp.rotation_euler = (0, 0, yaw)
    # boom IK in stacker-local space
    tip = sp.location + Vector((0, 0, 1.9)) - rs.location
    d = tip - PIVOT
    ang = math.atan2(d.z, d.x)
    boom.rotation_euler = (0, -ang, 0)
    inner.location = (max(0.0, d.length - 10.0), 0, 0)
    # lift cylinders: from chassis base to a point 4 m along the boom
    top = PIVOT + Vector((math.cos(ang) * 4.0, 0, math.sin(ang) * 4.0))
    v = top - BASE
    q = Vector((0, 0, 1)).rotation_difference(v.normalized())
    for barrel, rod, yy in rams:
        barrel.location = (BASE.x, yy, BASE.z)
        barrel.rotation_quaternion = q
        rod.location = Vector((BASE.x, yy, BASE.z)) + v.normalized() * 2.4
        rod.rotation_quaternion = q
        rod.scale = (1, 1, max(0.2, v.length - 2.4))
    # camera: wide shot → zoom on the container (it ends filling the frame)
    # camera: straight side view, then orbits 90° to face the machine head-on and zooms on the container
    z = seg(f, 62, 122)
    cam['yaw'] = lerp(0, 90, z)
    cam['pitch'] = 1.5
    lib.place_lens_camera(cam, tgt, (lerp(1.6, c.x, z), 0, lerp(6.0, c.z + 1.3, z)), lerp(28, 16.5, z))


cam, tgt = lib.lens_camera((1.6, 0, 6.0), yaw_deg=0, pitch_deg=1.5, dist=90, width=28)

for f in range(1, 151):
    apply(f)
    for o in [hero, sp, boom, inner, cam, tgt] + [r for b in rams for r in b[:2]]:
        for path in ('location', 'rotation_euler', 'rotation_quaternion', 'scale'):
            try:
                o.keyframe_insert(path, frame=f)
            except Exception:
                pass
    cam.data.keyframe_insert('lens', frame=f)

# ----------------------------------------------------------------------------- render
os.makedirs(args.out, exist_ok=True)
if '-' in args.frames:
    a, b = map(int, args.frames.split('-'))
    frames = range(a, b + 1)
else:
    frames = [int(x) for x in args.frames.split(',')]
for f in frames:
    s.frame_set(f)
    s.render.filepath = os.path.join(args.out, f'f{f:03d}.webp')
    bpy.ops.render.render(write_still=True)
    print('RENDERED', f, flush=True)
