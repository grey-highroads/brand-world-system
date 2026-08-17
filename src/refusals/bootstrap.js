// Bootstrap slates for the two clients that have refusals authored ahead of
// the matcher. See ADR 0017 step 3.
//
// These entries are the hand-authored step 1 fixture documents, carried over
// with their derivations intact. They were authored from each brand's approved
// protections plus ten recorded runs of synthesis output, and they passed a
// judged gate, which is what makes them fit to propose. Every entry enters as
// a proposal regardless of whether the fixture had it active, because nobody
// has ruled on it in this surface and a slate that arrives pre-accepted would
// be the system ruling on a person's behalf.
//
// Seeding from a fixture is the bootstrap mechanism for these two clients and
// for no others. Every client after them receives proposals from synthesis
// through the matcher, which is ADR 0017 step 2. The canonical fixtures live
// at fixtures/adr-0017-refusals/ and this module is generated from them; a
// change to one checks the other.

const SLATES = {
  "mycopop": [
    {
        "id": "ref-myc-property",
        "concern": "Borrowed entertainment property in frame",
        "statement": "Do not show recognizable characters, title screens, cabinet art, controllers, logos, type treatments, package designs, or playfields belonging to an existing entertainment property. Retro objects and symbols in frame are original to MycoPop.",
        "basis": {
            "origin": "inference",
            "confidence": "High",
            "derivedFrom": "The 8-bit style source is an outside party's material supplied as creative direction. Reached by all five grammar-reject captures and by the regenerated guardrails naming original retro forms."
        }
    },
    {
        "id": "ref-myc-pixel-layer",
        "concern": "Retro direction pasted on as a graphic layer",
        "statement": "Do not add game interfaces, score bars, lives counters, sprite overlays, pixel filters, or scan lines over a photograph. Build retro cues as physical sets, props, surfaces, and light inside the frame.",
        "basis": {
            "origin": "inference",
            "confidence": "High",
            "derivedFrom": "The 8-bit style source asks for a physical brand version of an outside reference rather than a copied graphic treatment. Reached by four of five grammar-reject captures."
        }
    },
    {
        "id": "ref-myc-costume",
        "concern": "Period reenactment instead of original retro form",
        "statement": "Do not build full period costumes, imitation collector rooms, or sets crowded with branded memorabilia. Retro forms sit beside current clothing and the current can.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The Official Website describes a modern convenient beverage while the 8-bit source asks for retro technology as a direction. Reached by one grammar-reject capture."
        }
    },
    {
        "id": "ref-myc-fantasy-forest",
        "concern": "Unreal nature staging around the product",
        "statement": "Do not build forests with impossible scale, saturated green glow, or a can placed without weight or contact. Record moss, bark, leaves, moisture, and daylight that a camera could have found.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The current Instagram screenshot shows repeated forest scenes with unusually saturated glow and isolated product placement. Reached by one grammar-reject capture."
        }
    },
    {
        "id": "ref-myc-refreshment",
        "concern": "Refreshment simulated rather than recorded",
        "statement": "Do not signal coldness through color washes, stock splashes, lens flares, weather panels, or stickers added after capture, and do not present the hero can warm, dusty, or dry. Record cold metal, condensation, ice, water, fruit, and daylight in camera.",
        "basis": {
            "origin": "inference",
            "confidence": "High",
            "derivedFrom": "The Odyssey Screenshot was supplied to raise the sense of refreshment as a physical quality rather than as a surface treatment. Reached by all five grammar-reject captures."
        }
    },
    {
        "id": "ref-myc-competitor",
        "concern": "Competitor execution reproduced",
        "statement": "Do not reproduce another beverage's can design, color assignments, typography, slogans, product lineup, retail composition, campaign props, or recurring social layout.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail on learning without copying, naming the Odyssey Screenshot as a competitor supplied only to inspire a more refreshing appearance. Reached by four grammar-reject captures and three regenerated guardrails."
        }
    },
    {
        "id": "ref-myc-artwork",
        "concern": "Identity artwork rebuilt from a screenshot",
        "statement": "Do not redraw, recolor, relabel, approximate, or reconstruct the MycoPop logo or can artwork from a screenshot, and do not photograph a screen capture as if it were finished artwork. Photograph the current physical package, or place supplied master files when they exist.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail protecting missing master assets: no logo master, packaging artwork, typography specification, or approved color values were supplied, and screenshots document current use without becoming production artwork. Reached by four grammar-reject captures and three regenerated guardrails."
        }
    },
    {
        "id": "ref-myc-medicine",
        "concern": "The drink staged as medicine",
        "statement": "Do not place the can in white examination rooms, dosage rows, medicine cabinets, laboratory coats, brain scans, anatomical displays, or before-and-after treatment layouts, and do not stage it among scattered powders, tinctures, pill piles, or apothecary clutter. Keep it in a beverage context.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of chalky or medicinal formats, alongside the FDA disclaimer and disease-claim prohibition on the Official Website. Reached by all five grammar-reject captures, three regenerated guardrails, and three regenerated lived-world rejects."
        }
    },
    {
        "id": "ref-myc-child-use",
        "concern": "A child shown consuming an adult-listed product",
        "statement": "Do not show children drinking, opening, or being handed the can. In family scenes consumption stays clearly with adults until intended age guidance is confirmed.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The Amazon listing identifies an adult intended age range while the Instagram screenshot shows children holding cans. Reached by one grammar-reject capture and one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-myc-transformation",
        "concern": "Instant physical or cognitive transformation shown",
        "statement": "Do not show glowing bodies, transformed brains, energy entering a person, impossible endurance, or extreme athletic feats presented as what the drink produces.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Current product facts and the FDA disclaimer on the Official Website. Reached by one grammar-reject capture and one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-myc-claims",
        "concern": "Health benefits stated as promises",
        "statement": "Do not state or imply that MycoPop diagnoses, treats, cures, prevents, or guarantees an outcome. Traditional use and research relationships stay described as such.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail on keeping functional claims measured, and the FDA disclaimer on the Official Website. Reached by three regenerated guardrails."
        }
    },
    {
        "id": "ref-myc-unsupported-facts",
        "concern": "Product specifics stated without records",
        "statement": "Do not state quantities, sourcing, certifications, calorie count, caffeine status, testing, organic status, or manufacturing standards unless a current product record supports the exact claim.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The Official Website and Amazon listing carry claims that need alignment before broad reuse. Reached by three regenerated guardrails."
        }
    },
    {
        "id": "ref-myc-stimulant",
        "concern": "Stimulant culture signaling",
        "statement": "Do not depict the drink as a high stimulant hit: no frantic speed, no aggressive gym-bro staging, no extreme-energy signaling, no always-on hustle framing where rest reads as failure.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail against imitating stimulant culture and the approved lived-world reject of aggressive gym-bro or extreme-energy signaling. The brand's differentiator is caffeine-free balanced energy. Reached by one regenerated guardrail and two regenerated lived-world rejects."
        }
    },
    {
        "id": "ref-myc-practice-as-rule",
        "concern": "Current practice promoted to approved guidance",
        "statement": "Do not treat the Instagram screenshot or the Amazon listing as approved identity standards. They document present practice; the Official Website governs approved claims.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The regenerated guardrails separating guidance from practice on two runs. No approved guardrail states this rule."
        }
    },
    {
        "id": "ref-myc-optimization-life",
        "concern": "A life organized around optimization",
        "statement": "Do not build the scene around tracking apps, supplement stacks, regimen boards, or a routine whose whole subject is self-optimization.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world rejects on two runs. Reasoned from the brand's ease and balance positioning on the Official Website."
        }
    },
    {
        "id": "ref-myc-gamer-stereotype",
        "concern": "Gamer stereotype standing in for the person",
        "statement": "Do not cast a narrow gamer stereotype, a darkened bedroom rig, or a headset-and-energy-drink setup as the person the brand serves.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world reject on one run, reasoned against the retro technology direction, which motivates the aesthetic without narrowing the audience."
        }
    },
    {
        "id": "ref-myc-ritual-cost",
        "concern": "Preparation ritual as the cost of the product",
        "statement": "Do not show scoops, shakers, measuring, blending, steeping, or any multi-step preparation as what taking the product requires.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world rejects on two runs, reasoned from the convenience positioning on the Official Website."
        }
    },
    {
        "id": "ref-myc-artificial-taste",
        "concern": "Artificial taste cues",
        "statement": "Do not stage the drink with candy-bright syrups, neon pours, or sweetener imagery that reads as artificial flavor.",
        "basis": {
            "origin": "evidence",
            "confidence": "Medium",
            "derivedFrom": "Approved lived-world reject of artificial-tasting sweetness or a strange aftertaste. Reached by one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-myc-crash",
        "concern": "Jitters and a crash as the cost of energy",
        "statement": "Do not show the shake, spike, and slump arc of a stimulant: no jittery hands, no wired stare, no collapse afterward.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of jitters and a hard crash. Reached by one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-myc-fear-wellness",
        "concern": "Fear-based wellness framing",
        "statement": "Do not build the scene around what happens without the product: no depletion imagery, no decline framing, no threat that the drink resolves.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world reject on one run, reasoned from the brand's ease and balance positioning."
        }
    },
    {
        "id": "ref-myc-direction-as-identity",
        "concern": "A declared direction presented as established identity",
        "statement": "Do not present the 8-bit direction as an identity the brand already owns. It is a direction to develop, and material built from it says so.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail treating 8-bit as a direction, sourced from an outside reference rather than from an established identity system. The direction source is named here because it motivated the refusal; the refusal itself is a rule in force."
        }
    },
    {
        "id": "ref-myc-testimony",
        "concern": "Customer testimony used as substantiation",
        "statement": "Do not convert review language into a brand claim. Reviews can show occasions and vocabulary; they do not evidence efficacy.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail separating customer testimony from proof."
        }
    },
    {
        "id": "ref-myc-mysticism",
        "concern": "Wellness mysticism without product facts",
        "statement": "Do not stage the product inside vague spiritual wellness imagery with nothing concrete about what it is: no ritual smoke, no unexplained symbols, no mystical staging standing in for ingredients and use.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of vague wellness mysticism without product facts."
        }
    },
    {
        "id": "ref-myc-dense-science",
        "concern": "Dense scientific language without practical meaning",
        "statement": "Do not lead with mechanism language, compound names, or study framing that carries no practical meaning for the person drinking it.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of dense scientific language with no practical meaning."
        }
    }
],
  "dialog-health": [
    {
        "id": "ref-dh-sender",
        "concern": "Unidentified sender or no visible next action",
        "statement": "Do not show a message screen with an unidentified sender, an unclear purpose, or no visible action to take. Sender identity and the requested action are legible whenever a message is central to the frame.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The RCS Presentation emphasizes verified senders, organization branding, and clear direct actions. Reached by two grammar-reject captures."
        }
    },
    {
        "id": "ref-dh-no-task",
        "concern": "Staged scene with no real task in it",
        "statement": "Do not show staged groups smiling at the camera, handshakes, unused devices, empty corridors, or generic bedside scenes with no communication task underway. People and tools are engaged in recognizable work.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "Reasoned from the Official Website's focus on practical workflows and reduced staff burden. Reached by two grammar-reject captures and one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-dh-clutter",
        "concern": "Screen content that obscures the action",
        "statement": "Do not show screens crowded with tiny copy, competing buttons, decorative charts, or layered windows that hide the intended action.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "Reasoned from the Official Website's emphasis on simple communication and the RCS Presentation's direct action structure. Reached by one grammar-reject capture."
        }
    },
    {
        "id": "ref-dh-personal-data",
        "concern": "Real personal or health information in frame",
        "statement": "Do not show real names, dates of birth, diagnoses, phone numbers, account details, clinical results, or message histories on any screen or paper surface. Visible content is invented.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The Official Website states privacy is paramount and describes the platform as HIPAA compliant. Reached by four grammar-reject captures and one regenerated guardrail. No approved guardrail states this rule."
        }
    },
    {
        "id": "ref-dh-logo-rebuild",
        "concern": "Identity artwork rebuilt from a screenshot",
        "statement": "Do not redraw, approximate, stretch, crop, recolor, or reconstruct the Dialog Health logo or its approved arrangements. Place the supplied artwork unaltered, and use RCS Template.png unchanged in its role.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail against reconstructing exact identity assets, naming the brand kit as the authority for logos and lockups and RCS Template.png as a separate canonical background asset. Reached by four grammar-reject captures and three regenerated guardrails."
        }
    },
    {
        "id": "ref-dh-guessed-color",
        "concern": "Brand color estimated by eye",
        "statement": "Do not pick a green from a website capture, PDF preview, or slide screenshot. Use a confirmed production value from the brand files, and where no value is supplied, leave the color unset rather than inventing one.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "The brand kit names Main Green but the supplied extraction carries no numerical specification, and the approved guardrail directs use of the canonical file rather than estimating a color. Reached by one grammar-reject capture and one regenerated guardrail."
        }
    },
    {
        "id": "ref-dh-clinical-product",
        "concern": "The platform staged as clinical treatment",
        "statement": "Do not arrange the product as medication, diagnostic equipment, dosage instructions, or a treatment tool. It stays visibly in the communication and workflow role.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The Official Website positions Dialog Health as healthcare communication software rather than a clinical treatment. Reached by one grammar-reject capture."
        }
    },
    {
        "id": "ref-dh-unreal-tech",
        "concern": "Unreal technology imagery instead of a real scene",
        "statement": "Do not use floating message bubbles, artificial interface overlays, glowing data trails, or decorative message streams in place of a real phone, a real room, and a person acting.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of generic technology spectacle disconnected from healthcare work. Reached by one grammar-reject capture."
        }
    },
    {
        "id": "ref-dh-demo-as-fact",
        "concern": "Demonstration material presented as identity or fact",
        "statement": "Do not present the fictional sender name, sample logos, invented screens, patient names, dates, or message designs from the RCS deck as Dialog Health identity assets or as a live customer deployment.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail keeping sales examples in their proper role: the RCS presentation is representative sales evidence that can be improved, and its WynterHealth examples are demonstrations. Reached by two grammar-reject captures and three regenerated guardrails."
        }
    },
    {
        "id": "ref-dh-generic-category",
        "concern": "The work is not identifiably healthcare",
        "statement": "Do not build a frame that could be any consumer messaging app or any software company: no anonymous phone close-up, no generic office life, no person defined by devices or trends, no day dominated by software for its own sake. The healthcare or employee communication task is visible.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail on presenting more than messaging, which keeps the platform larger than a generic texting utility and describes a suite connecting patient and employee journeys. Reached by one grammar-reject capture, three regenerated guardrails, and three regenerated lived-world rejects."
        }
    },
    {
        "id": "ref-dh-clinical-theater",
        "concern": "Clinical theater as healthcare shorthand",
        "statement": "Do not use white seamless clinical sets, staged laboratory props, floating medical symbols, diagnostic poses, or rows of unused devices to signal healthcare. Show the communication task in a working environment.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "Reasoned from the Official Website's description of healthcare workflows and secure communication rather than clinical practice. Reached by two grammar-reject captures and one regenerated lived-world reject."
        }
    },
    {
        "id": "ref-dh-app-step",
        "concern": "An app download shown as a required step",
        "statement": "Do not show app store badges, installation screens, or a recipient downloading a separate Dialog Health app before they can act. The action happens in mobile messaging.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of extra apps or unnecessary steps when a direct mobile action will work, and the Official Website's statement that the cloud-based software requires no app download. Reached by one grammar-reject capture and one regenerated guardrail."
        }
    },
    {
        "id": "ref-dh-overclaim",
        "concern": "Outcome, compliance, or leadership claims beyond their evidence",
        "statement": "Do not use treatment imagery, medical result graphics, perfect attendance boards, or before-and-after constructions to imply a clinical or performance result, and do not broaden security, privacy, or compliance statements past the scope their evidence supports.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved guardrail against broadening regulated or quantified claims, and the approved lived-world reject of unqualified promises about outcomes, security, compliance, or industry leadership. The website makes HIPAA, TCPA, CTIA, reliability, and outcome claims with no supporting documentation in the register. Reached by one grammar-reject capture and three regenerated guardrails."
        }
    },
    {
        "id": "ref-dh-automation",
        "concern": "Automation replacing human judgment",
        "statement": "Do not show a system acting with no person in the loop, and do not show cold automated messaging that leaves no visible way to respond or reach help. Automation directs attention to where a person then acts.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of cold automation that obscures how a person can respond or get help. Reached by one regenerated guardrail and two regenerated lived-world rejects."
        }
    },
    {
        "id": "ref-dh-frictionless",
        "concern": "The frictionless fantasy",
        "statement": "Do not show every recipient responding, every workflow running without exception, or a person with unlimited time, staff, and support. Show the real conditions the work happens in.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world rejects across all three stability runs. Reasoned from the Official Website's framing of staff burden and follow-up load."
        }
    },
    {
        "id": "ref-dh-roles",
        "concern": "A role portrayed without the work it actually does",
        "statement": "Do not build the story around executives alone, or cast an administrator with no visible connection to patient or employee outcomes. Include the staff who manage calls, schedules, forms, billing, and follow-up.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world rejects on two runs. Reasoned from the Official Website's account of who does the communication work."
        }
    },
    {
        "id": "ref-dh-patient-passive",
        "concern": "The patient as a passive recipient or a metric",
        "statement": "Do not show patients only receiving messages, and do not reduce a patient to a number on a dashboard. Show a person completing a healthcare task.",
        "basis": {
            "origin": "inference",
            "confidence": "Medium",
            "derivedFrom": "The regenerated lived-world rejects on two runs. Reasoned from the approved world guidance requiring both sides of the communication."
        }
    },
    {
        "id": "ref-dh-fear",
        "concern": "Patient vulnerability dramatized",
        "statement": "Do not dramatize fear, distress, or clinical crisis: no frightened patient, no emergency staging, no vulnerable moment used to make the message matter. Show a useful action such as confirming, scheduling, completing a form, paying, preparing, or requesting help.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of fear-based depictions of patients or clinical situations, and partly the approved guardrail on making care communication practical, which directs focus onto useful actions rather than dramatizing patient vulnerability. Absent from the regenerated guardrails, the regenerated lived-world rejects, and the grammar rejects in all three stability runs."
        }
    },
    {
        "id": "ref-dh-feature-inventory",
        "concern": "Feature inventory without consequence",
        "statement": "Do not present a list of capabilities with no user or business consequence attached to them.",
        "basis": {
            "origin": "evidence",
            "confidence": "High",
            "derivedFrom": "Approved lived-world reject of dense feature inventories without a clear user or business consequence."
        }
    }
],
};

export function bootstrapSlateFor(clientId) {
  return SLATES[clientId] || null;
}

export function bootstrapClientIds() {
  return Object.keys(SLATES);
}
