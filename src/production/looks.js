// Look library.
//
// A look is a photographic medium at a moment in time, carrying every
// consequence of that medium. It is not a mood, not a filter, and not a set of
// imperfections sprinkled over a clean render. The reference images that drove
// this file are a 1990s drugstore print, a mid 1970s color slide, and a 1970s
// consumer color negative at dusk. What makes each unmistakable is not that it
// is flawed. It is that every attribute agrees: the light source, the color
// response, the grain structure, the tonal curve, the resolution, and what the
// medium physically cannot do.
//
// This is code, not configuration, per ADR 0018: the library is code, a brand's
// slate is governed configuration, and selection is a later question. Nothing
// here is synthesized from a brand's sources, because no brand's sources
// document camera character.
//
// Register rule, from the 2026-08-17 audit: every clause states a visible
// consequence. This renderer obeys physical facts and ignores perceptual
// targets, so "grain clumps in the midtones" is usable and "authentic" is not.
//
// Every look states what the medium cannot do, because that is what separates
// a medium from a mood. A frame that can do everything is the default render.

export const LOOKS = {
  film_noir: {
    id: "film_noir",
    label: "Film noir",
    line:
      "Black and white, no color anywhere in the frame. One hard light source, small and undiffused, placed high and to one side and well off the camera axis, throwing hard edged shadows with sharp boundaries rather than soft falloff. Nothing fills the shadow side: the unlit half of every face goes to solid black and stays there, and large areas of the frame hold no detail at all. The tonal curve is steep and the midtones are squeezed out, so surfaces are either bright or gone. Highlights on skin and metal clip to pure white. Shadow patterns from window blinds, railings, banisters, or foliage fall across walls, floors, and faces and are as much the subject as the person. Grain is coarse and clumped, heaviest in the greys. Deep focus holds the foreground and the far wall together rather than separating them. The camera sits low and tilts up, or high and looks down, and the horizon is not level. Fill light, even illumination, and a fully legible frame are all outside what this medium does.",
  },

  drugstore_flash: {
    id: "drugstore_flash",
    label: "Drugstore flash print",
    line:
      "A direct on camera flash fired straight at the subject from the camera position, the only meaningful light in the frame. Faces are flat and evenly blasted with no shaping, the nearest surfaces are overexposed toward white, and everything beyond about eight feet falls off into underexposed murk. A hard shadow sits on the wall directly behind each subject, low and offset. The lens is a fixed wide angle and mildly distorts anything near the edges. Color is a machine print from a consumer lab: skin runs warm and slightly orange, whites carry a magenta or yellow cast, blacks are milky rather than deep, and the whole frame sits in a narrow contrast range. Grain is fine but the resolution is soft, so hair and fabric edges never fully resolve and small background detail turns to mush. Subjects face the camera and know they are being photographed. Shallow depth of field, shaped light, and a clean neutral white balance are all outside what this medium does.",
  },

  color_slide_1975: {
    id: "color_slide_1975",
    label: "Color slide, mid seventies",
    line:
      "Daylight color reversal film in bright sun. Color is dense and saturated with reds and blues pushed hardest, greens turned slightly yellow, and skin carrying a warm amber weight. The tonal range is narrow and unforgiving: highlights clip early and completely while shadows fall to a heavy near black with a faint blue green shift inside them, and nothing recovers at either end. Bright areas bloom softly into whatever is next to them, so light edges glow slightly and fine detail is lost at the boundary. Grain is tight but visible in flat areas like sky and skin. Contrast is high and the midtones are compressed. The lens flares readily into a low sun, dropping veiled patches and rings across the frame. Overall sharpness is moderate and falls off toward the corners. Wide dynamic range, neutral color, and clean shadow detail are all outside what this medium does.",
  },

  consumer_negative_dusk: {
    id: "consumer_negative_dusk",
    label: "Consumer negative at dusk",
    line:
      "Fast consumer color negative film shot in failing light, pushed a stop past where it wanted to be. The whole frame carries a single warm orange cast that is never corrected, and the shadows lift into a muddy brown rather than reaching black. Grain is coarse and obvious across the entire frame, heaviest in the sky and in flat skin, and it is part of the surface rather than an overlay. Color saturation is low and the palette collapses toward amber, so a red and a brown read as neighbors. Highlights from any small bright source bloom into soft halos with visible fringing at their edges. Focus is approximate: the subject is close to sharp rather than exactly sharp, and anything moving smears. Detail in dark clothing and dark foliage is simply absent. Contrast is low and the image feels slightly flat and slightly veiled, as though a thin fog sits over it. Clean color, tight grain, and precise focus are all outside what this medium does.",
  },

  large_format_daylight: {
    id: "large_format_daylight",
    label: "Large format daylight",
    line:
      "A single large sheet of film exposed on a view camera, on a tripod, at a small aperture. Resolution is extreme and even: individual fibers in fabric, pores in skin, grain in wood, and lettering far into the background are all legible, and grain is nearly invisible. Tonality is long and smooth, holding detail in the brightest windows and the deepest shadows at once, with gradations that step gently rather than snapping. Light is whatever daylight is present, directional and unmodified, with soft edged shadows. Color is accurate and restrained rather than saturated. The subject is still, because the exposure was long enough to require it, and anything that moved has smeared into a soft transparent trace. Perspective lines are corrected and vertical. Handheld immediacy, shallow separation, and a caught unrepeatable moment are all outside what this medium does.",
  },

  available_light_interior: {
    id: "available_light_interior",
    label: "Available light interior",
    line:
      "One window is the only light in the room and nothing else is added. Surfaces facing the window are correctly exposed and everything turned away from it falls off steeply, so the far side of the room reads two or three stops down and holds little detail. The light is soft edged but strongly directional, and its color comes from what is outside: cool blue on an overcast day, warm on a low sun, green where it passes through foliage. Shadows on the wall carry color bounced from whatever is near them. The lens is fast and wide open, so one plane is sharp and everything else falls away quickly, with background highlights rendering as soft rounded shapes. Grain sits in the shadows and underexposed areas and is absent from the lit surfaces. Highlights on the window frame and any glass clip and hold nothing. Even illumination, recovered shadow detail, and a neutral color balance are all outside what this medium does.",
  },
};

export const LOOK_IDS = Object.keys(LOOKS);

/**
 * Resolve a look by id. Returns null for an unknown or absent id, which is the
 * signal to compile the shared capture floor instead.
 */
export function resolveLook(id) {
  if (!id) return null;
  return LOOKS[String(id)] || null;
}
