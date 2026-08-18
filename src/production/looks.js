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

  // The two professional looks. Both are commercially clean and neither reads
  // as generated, because in each the medium is legible: a strobe leaves
  // evidence, and overcast daylight has a direction and a color. Clean is not
  // the problem. Clean with no medium behind it is the problem.
  studio_seamless_flash: {
    id: "studio_seamless_flash",
    label: "Studio seamless, direct strobe",
    line:
      "A single studio strobe fired through a large modifier close to the subject and slightly above the lens axis, against a seamless paper backdrop in white or a flat neutral tone with no texture, corner, or horizon. Catchlights sit high and round in both eyes. The shadow under the nose and chin is short and its edge is soft but definite. The falloff is fast: the subject is correctly exposed and the backdrop behind reads a stop or more down, going grey rather than white toward the edges of the frame. Skin holds its own texture, pores and fine lines and any unevenness in color, because the light is soft rather than because it was retouched away. Color is accurate and restrained, with the subject's clothing carrying the only strong hues in the frame. The image is sharp from the front of the face to the ears and falls off immediately behind. Grain is nearly absent. The subject looks into the lens and holds still. Environment, ambient light, and any sense of a moment happening on its own are all outside what this setup does.",
  },

  overcast_editorial: {
    id: "overcast_editorial",
    label: "Overcast daylight editorial",
    line:
      "Open shade under a fully overcast sky, which is one enormous soft source directly above. Shadows are present but very soft, deepest under the chin, the brow, and anywhere fabric folds. Contrast is low and the whole tonal range sits in the middle, with no clipped highlight and no blocked black anywhere in the frame. Color is cool and slightly desaturated: skin runs neutral to faintly pink, whites read very slightly blue, and greens are muted rather than vivid. A fast lens wide open holds the face sharp and lets everything past the subject dissolve into soft undifferentiated tone. Hair moves and some of it crosses the face rather than being cleared away. Fabric shows its weave and its creases. Fine grain sits evenly across the frame. Hard shaped light, deep shadow, and high saturation are all outside what this condition provides.",
  },

  anamorphic_widescreen: {
    id: "anamorphic_widescreen",
    label: "Anamorphic widescreen film",
    line:
      "Anamorphic lenses on motion picture film. Out of focus highlights render as vertical ovals rather than circles, and any bright point source draws a long horizontal streak of flare straight across the frame. The center is sharp and the far left and right edges are noticeably softer and slightly stretched, so faces near the edges distort a little. Depth is shallow relative to the width of the frame, so a subject separates cleanly from a landscape that runs a long way behind them. Color is warm and filmic with reds and skin tones favored, blacks lifted slightly rather than absolute, and highlights rolling off gently instead of clipping. Grain is fine, present, and moves. The horizon sits low and the sky takes the upper half. Perfectly circular bokeh, edge to edge sharpness, and a tight vertical composition are all outside what this format does.",
  },

  bleach_bypass_90s: {
    id: "bleach_bypass_90s",
    label: "Bleach bypass, nineties",
    line:
      "Color film processed with the silver left in, which lays a hard black and white image over a weakened color one. Saturation drops far down so the frame reads almost monochrome with only the strongest reds and skin tones surviving as color at all. Contrast is severe: highlights blow out completely and shadows crush to black with a visible cyan or green cast sitting in the darker midtones. Grain is coarse, gritty, and everywhere, heaviest in the flat areas. Skin looks pale and slightly waxy with every blemish and vein reading clearly. Interiors are lit by whatever is there, usually overhead fluorescent or a bare bulb, and nothing is filled. Focus is handheld and approximate. Rich saturation, gentle tonal transitions, and clean shadows are all outside what this process does.",
  },

  flash_night_street: {
    id: "flash_night_street",
    label: "Flash on a night street",
    line:
      "A powerful flash fired at a subject standing on a street after dark, with a shutter too fast to record much of the ambient city behind them. The subject is lit hard and cleanly with a crisp shadow edge, and everything more than a few feet beyond falls to deep black with only streetlights, windows, and wet reflections surviving as small bright points. Wet pavement returns the flash as hard specular streaks. The color is split: the subject reads neutral or cool from the flash while distant lights burn warm orange or green against the black. Blacks are absolutely black and hold nothing. Skin is rendered with high clarity, every texture and stray hair caught by the light. The subject is aware of the camera and is composed for it. Ambient atmosphere, soft gradation, and a legible background are all outside what this technique does.",
  },

  pushed_bw_reportage: {
    id: "pushed_bw_reportage",
    label: "Pushed black and white reportage",
    line:
      "Fast black and white film rated well past its speed and developed longer to compensate. Grain is large, sharp edged, and unmistakable at any size, and it is most visible in skin and in flat grey areas. Contrast is high with the midtones thinned out, so tones separate abruptly rather than gradually. Highlights on skin and on bright surfaces clip to white. Shadows fall to black and hold little. Sharpness is present but the grain competes with fine detail, so hair and fabric read as texture rather than as individual strands. The light is whatever the street or the room provided, often from a single window or overhead source, and nothing is filled. The camera is handheld, close, and slightly below or above the subject's eye line. Smooth tonality, fine grain, and controlled light are all outside what this treatment does.",
  },

  saturated_daylight_adventure: {
    id: "saturated_daylight_adventure",
    label: "Saturated daylight, outdoors",
    line:
      "Bright direct sun in clear high altitude or coastal air, shot on a small aperture for depth. Color is deeply saturated with the sky rendering a dense blue that darkens toward the top of the frame, and a single piece of high visibility clothing carrying the only warm color against it. Contrast is high and shadows are hard edged and short, because the sun is high. Everything from the subject to the far ridge line is in focus and legible. Detail is extreme: snow texture, rock grain, and the weave of technical fabric all resolve. Grain is nearly absent. Highlights on snow, water, and ice clip to pure white in the brightest specular areas. The subject is small in the frame and the environment is the larger part of the picture. Shallow depth, soft light, and muted color are all outside what these conditions give.",
  },

  daylight_street_documentary: {
    id: "daylight_street_documentary",
    label: "Daylight street documentary",
    line:
      "Ordinary daylight on a city street, sun somewhere off to one side and not managed in any way. Some surfaces are in hard sun and others are in the shade of buildings within the same frame, and the exposure favors the subject so the sunlit areas run bright and the shaded areas run dark. Color is accurate rather than graded, and the frame carries whatever colors the street contains: signage, painted walls, car paint, all competing rather than harmonized. Depth is moderate, so the subject is sharp and the traffic and passersby behind them are soft but still identifiable. People in the background are caught mid stride, mid gesture, or looking somewhere other than at the camera, and at least one is partly cut by a pole, a car, or the frame edge. Grain is fine and present. The subject is walking and is photographed from the front at a distance. Controlled light, a clean background, and a harmonized palette are all outside what a street provides.",
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
