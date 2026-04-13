r"""
Image Generator — Copilot Image Automation
============================================
Connects to your EXISTING Chrome browser via CDP and submits image prompts
to copilot.microsoft.com one at a time, saving generated images.

Originally built for D&D monster portraits; now generalized for any prompt
set (scene backgrounds, UI icons, character portraits, etc.).

SETUP (one-time):
    pip install playwright
    playwright install chromium

USAGE:
    Option A (automatic — recommended):
      python generate-images.py --launch --only 1

    Option B (manual):
      1. Close ALL Chrome windows (including system tray).
      2. Launch Chrome with debug port AND a separate user-data-dir:
           "C:\Program Files (x86)\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir=%TEMP%\chrome-debug-profile
      3. Sign in to https://copilot.microsoft.com/ in that window.
      4. Run this script in another terminal.

    Flags:
      --launch             Auto-launch Chrome with debug port (kills existing instances)
      --start 5            Start from prompt #5 (skip earlier ones)
      --only 12            Run only prompt #12
      --delay 300          Base seconds between prompts (default: 300, randomized ±40%)
      --save-dir ./imgs    Where to save images (default: ./images/missing-expedition)
      --cdp-url URL        Chrome CDP endpoint URL (default: http://127.0.0.1:9222)
      --dry-run            Print prompts without submitting
      --list               List all prompts and exit
"""

import argparse
import json
import os
import random
import re
import sys
import time
import urllib.request
from pathlib import Path


# ---------------------------------------------------------------------------
# Human-like timing helpers
# ---------------------------------------------------------------------------

def human_pause(low=1.0, high=5.0, label=None):
    """Random pause to mimic human hesitation before an action."""
    delay = random.uniform(low, high)
    if label:
        print(f"  ({label} — pausing {delay:.1f}s)")
    time.sleep(delay)


def human_type(locator, text):
    """Type text character by character with random inter-key delays."""
    locator.click()
    human_pause(0.5, 1.5)
    for ch in text:
        locator.type(ch, delay=0)
        time.sleep(random.uniform(0.02, 0.12))


def random_delay(base_seconds):
    """Return a randomized delay: base ± 40%, minimum 10s."""
    low = max(10, base_seconds * 0.6)
    high = base_seconds * 1.4
    return random.uniform(low, high)


# ---------------------------------------------------------------------------
# Master prompt prefix (prepended to every scene prompt)
# ---------------------------------------------------------------------------

MASTER_PREFIX = (
    "Generate an image of: "
    "Medieval illuminated manuscript illustration, grimoire page art. "
    "Square format (1:1 aspect ratio), 512×512 pixels. "
    "Rich parchment-aged background with deep jewel tones — ultramarine blue, "
    "vermillion red, burnished gold leaf accents, deep forest green. "
    "Stylized medieval art style — NOT realistic, inspired by 13th century "
    "European illuminated manuscripts, Book of Kells, bestiaries, and alchemical texts. "
    "Intricate knotwork or vine border framing the central image. "
    "The central subject should be a symbolic illustration, bold and iconic. "
    "Dark vignette edges fading to near-black for seamless card integration. "
    "No text, no words, no letters, no watermarks, no logos. "
    "Painted texture with visible brushstrokes and gold leaf highlights. "
)

PORTRAIT_PREFIX = MASTER_PREFIX


# ---------------------------------------------------------------------------
# Prompts — High Burn Hustle character portraits
# ---------------------------------------------------------------------------

PROMPTS = [
    # ===== IDENTITY =====
    {
        "id": 1,
        "file": "card-the-gift.png",
        "name": "The Gift",
        "group": "Identity",
        "prompt": MASTER_PREFIX + (
            "A single human eye opening wide inside a radiant golden sun, "
            "surrounded by concentric circles of arcane symbols. The eye's iris "
            "is deep violet with flecks of gold. Rays of light emanate outward "
            "in all directions. Twisting vine borders with thorns frame the image. "
            "The eye sees beyond the mortal world — this is the moment of awakening. "
            "Rich gold leaf on the sun's corona, deep midnight blue background."
        ),
    },

    # ===== TECHNIQUES =====
    {
        "id": 2,
        "file": "card-creo.png",
        "name": "Creo — The Art of Creation",
        "group": "Technique",
        "prompt": MASTER_PREFIX + (
            "A robed hand reaching down from golden clouds, fingers spread, "
            "dropping seeds that burst into elaborate golden flowers and vines "
            "as they fall. Below, barren earth transforms into a garden. "
            "The hand glows with warm amber light. Stars emerge where the "
            "fingertips point. The border is woven from living green vines "
            "bearing fruit. Everything the hand touches becomes beautiful and whole."
        ),
    },
    {
        "id": 3,
        "file": "card-perdo.png",
        "name": "Perdo — The Art of Destruction",
        "group": "Technique",
        "prompt": MASTER_PREFIX + (
            "A skeletal hand emerging from darkness, fingers curled around "
            "a crumbling stone tower that dissolves into dust and ash. "
            "Where the fingers grip, stone becomes sand, iron becomes rust. "
            "A moth circles the tower's last standing fragment. "
            "The background is deep crimson fading to black. The border "
            "is made of bare, dead branches and scattered bones. "
            "Beautiful in its terrible finality."
        ),
    },
    {
        "id": 4,
        "file": "card-intellego.png",
        "name": "Intellego — The Art of Perception",
        "group": "Technique",
        "prompt": MASTER_PREFIX + (
            "A great owl perched on an open book, its enormous eyes reflecting "
            "scenes of distant places — a castle, a forest, a storm at sea. "
            "Concentric rings of tiny symbols orbit the owl's head like a halo. "
            "The owl's feathers are deep ultramarine blue with gold-tipped edges. "
            "Behind it, a night sky filled with constellations that form "
            "the shapes of hidden truths. The border is woven from "
            "ribbons inscribed with alchemical notation."
        ),
    },

    # ===== FORMS =====
    {
        "id": 5,
        "file": "card-ignem.png",
        "name": "Ignem — The Form of Fire",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A salamander coiled within a perfect sphere of flame, its scales "
            "glowing like embers — orange, gold, and deep red. The fire "
            "illuminates medieval geometric patterns radiating outward. "
            "Small tongues of flame curl through an ornate border of "
            "interlocking circles and triangles. The salamander's eye "
            "is a single bright point of white-hot light. "
            "Background of deep crimson and burnt umber."
        ),
    },
    {
        "id": 6,
        "file": "card-vim.png",
        "name": "Vim — The Form of Magic Itself",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A crystal vial or alembic flask floating in void, filled with "
            "crackling violet lightning and swirling luminous particles. "
            "Concentric arcane circles surround the vessel — orbiting sigils "
            "and planetary symbols in burnished gold. Energy tendrils reach "
            "outward from the vial's stopper. The border is formed from "
            "intertwined serpents biting their own tails (ouroboros motif). "
            "Background of deepest indigo and purple."
        ),
    },

    # ===== VIS & TEXTS =====
    {
        "id": 7,
        "file": "card-tattered-folio.png",
        "name": "A Tattered Folio",
        "group": "Text",
        "prompt": MASTER_PREFIX + (
            "An ancient open book lying on a wooden desk, its pages yellowed "
            "and water-stained. Cramped Latin text covers the visible pages, "
            "with hand-drawn diagrams of pentagrams and celestial charts in "
            "the margins. A quill pen rests across one page. A single candle "
            "illuminates the scene from above, casting dramatic shadows. "
            "Some marginalia glow faintly with supernatural blue light. "
            "The border is a pattern of interlocking book clasps and chains."
        ),
    },

    # ===== MYSTERIES =====
    {
        "id": 8,
        "file": "card-enigma.png",
        "name": "The Enigma of Criamon",
        "group": "Mystery",
        "prompt": MASTER_PREFIX + (
            "A human face shown frontally, eyes closed in meditation, covered "
            "entirely in spiraling mystical symbols and geometric tattoos that "
            "glow faintly gold against pale skin. The symbols seem to move — "
            "spirals within spirals. Behind the face, a great mandorla shape "
            "of pure light splits into fractal patterns. The face is serene, "
            "transcendent. The border is made of interlocking Möbius strips "
            "and impossible geometries. Deep purple and gold color palette."
        ),
    },
    {
        "id": 9,
        "file": "card-heartbeast.png",
        "name": "The Heartbeast Awakened",
        "group": "Mystery",
        "prompt": MASTER_PREFIX + (
            "A figure caught mid-transformation — the left half is a robed "
            "human scholar, the right half is a great silver wolf. They share "
            "one body seamlessly, the transformation flowing like water "
            "at the dividing line. The human eye is brown and thoughtful; "
            "the wolf eye is amber and wild. Both halves are surrounded by "
            "a primordial forest of ancient oaks. A full moon rises behind. "
            "The border is woven from animal tracks and paw prints in gold."
        ),
    },

    # ===== LOCATIONS =====
    {
        "id": 10,
        "file": "card-standing-stones.png",
        "name": "A Clearing of Standing Stones",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "A circle of tall standing stones on a hilltop at dawn, "
            "silhouetted against a sky of deep orange and violet. "
            "Morning dew on the grass between the stones glows with "
            "tiny points of supernatural light — visible vis. "
            "Faint ghostly geometric lines connect the stones like a "
            "constellation diagram. A single robed figure approaches "
            "from below, dwarfed by the ancient monoliths. "
            "The border is carved from rough stone with Celtic knotwork."
        ),
    },

    # ===== REMAINING TECHNIQUES =====
    {
        "id": 11,
        "file": "card-muto.png",
        "name": "Muto — The Art of Transformation",
        "group": "Technique",
        "prompt": MASTER_PREFIX + (
            "A caterpillar and a butterfly sharing one body, caught in the moment "
            "of metamorphosis. The left half is the crawling larva with rough "
            "brown-green skin; the right half unfolds into iridescent wings of "
            "gold, purple, and crimson. Spiraling alchemical transformation "
            "symbols orbit around them. Water flows upward in the background "
            "and fire freezes into crystal. The border is woven from Möbius "
            "strips — surfaces that have no inside or outside."
        ),
    },
    {
        "id": 12,
        "file": "card-rego.png",
        "name": "Rego — The Art of Control",
        "group": "Technique",
        "prompt": MASTER_PREFIX + (
            "A crowned hand extended in a commanding gesture, palm outward. "
            "Below the hand, stones lift themselves into the shape of an archway, "
            "water parts into two columns, and flames bow like courtiers. "
            "Golden chains of command radiate from each fingertip, connecting "
            "to the elements below. The hand wears a signet ring bearing "
            "a pentacle. The border is formed from rigid geometric patterns — "
            "perfect order imposed on chaos. Deep royal purple and gold palette."
        ),
    },

    # ===== REMAINING FORMS =====
    {
        "id": 13,
        "file": "card-animal.png",
        "name": "Animal — The Form of Beasts",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A majestic stag standing in a forest clearing, antlers spreading "
            "like a crown of bone. Around the stag, a circle of other beasts — "
            "a wolf, an eagle, a serpent, a bear — each rendered in the "
            "stylized manner of a medieval bestiary. Their eyes all glow "
            "with amber intelligence. Oak leaves and acorns fill the border. "
            "Deep forest green and earth brown palette with gold highlights "
            "on fur and feather."
        ),
    },
    {
        "id": 14,
        "file": "card-corpus.png",
        "name": "Corpus — The Form of the Body",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A Vitruvian-style human figure rendered in medieval manuscript art, "
            "arms outstretched within a circle and square. Anatomical details "
            "are drawn as flowing lines of golden energy tracing veins and bones. "
            "The four humors are represented as colored motes around the body — "
            "red, yellow, black, white. The figure's heart glows brightest. "
            "The border features intertwined hands and healing herbs. "
            "Warm flesh tones against deep burgundy background."
        ),
    },
    {
        "id": 15,
        "file": "card-mentem.png",
        "name": "Mentem — The Form of the Mind",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A human head in profile, the top of the skull opening to reveal "
            "a luminous interior. Inside the mind, miniature scenes play out — "
            "a tiny city, a storm, a lover's face, a battlefield — all the "
            "contents of thought. Radiating golden threads connect the mind "
            "to shadowy other figures in the distance. The border is woven "
            "from thought-bubbles and spiraling text. Deep violet and silver "
            "palette with gold neural pathways."
        ),
    },
    {
        "id": 16,
        "file": "card-herbam.png",
        "name": "Herbam — The Form of Plants",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A great oak tree viewed from below, its roots descending into "
            "dark earth and its branches ascending into golden light. The trunk "
            "is carved with druidic faces. Mushrooms, ferns, and wildflowers "
            "grow in abundance at the roots, each plant glowing faintly with "
            "inner light. Ivy and moss cover everything. The border is woven "
            "from braided vines bearing leaves of every season simultaneously. "
            "Rich greens and earthy browns with gold-tipped leaves."
        ),
    },
    {
        "id": 17,
        "file": "card-aquam.png",
        "name": "Aquam — The Form of Water",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A great wave curling into a spiral, within which swims a luminous "
            "fish with scales of silver and gold. The water is rendered in "
            "deep sapphire blue with white foam highlights. Beneath the wave, "
            "a submerged chalice catches droplets of liquid moonlight. "
            "Rain falls upward at the edges. The border is formed from "
            "interlocking wave patterns and Celtic water knots. "
            "Deep ocean blue and silver palette."
        ),
    },
    {
        "id": 18,
        "file": "card-terram.png",
        "name": "Terram — The Form of Earth",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A cross-section of the earth revealing layers of stone, crystal, "
            "and buried treasure. At the center, a geode cracks open to reveal "
            "amethyst crystals glowing with inner light. Above ground, a mountain "
            "peak touches the stars. Veins of gold ore run through dark rock. "
            "A pickaxe and hammer crossed below. The border is carved from "
            "rough stone with embedded gems and fossils. "
            "Earth brown, grey, and deep amber palette."
        ),
    },
    {
        "id": 19,
        "file": "card-auram.png",
        "name": "Auram — The Form of Air",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A great wind personified as a face blowing from a cloud, in the "
            "classical medieval wind-map style. Lightning bolts arc between "
            "thunderclouds below. A single feather spirals in the gale, "
            "untouched and serene. Birds ride the currents in the distance. "
            "Swirling cloud patterns fill the background. The border is "
            "made of flowing ribbons and wind-swept banners. "
            "Pale blue, silver-grey, and electric white palette."
        ),
    },
    {
        "id": 20,
        "file": "card-imaginem.png",
        "name": "Imaginem — The Form of Images",
        "group": "Form",
        "prompt": MASTER_PREFIX + (
            "A polished silver mirror floating in darkness, reflecting a scene "
            "that does not exist in its surroundings — a sunlit garden with "
            "impossible flowers. Around the mirror, translucent ghostly copies "
            "of the same scene fragment and distort. A peacock feather rests "
            "against the mirror frame, its eye-pattern watching. The border "
            "is formed from repeating mirror fragments, each showing a "
            "different reflection. Iridescent and silver palette."
        ),
    },

    # ===== LOCATIONS =====
    {
        "id": 21,
        "file": "card-ruined-chapel.png",
        "name": "A Ruined Chapel",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "A crumbling stone chapel in a dark forest, its roof collapsed, "
            "altar cracked. Thorny vines grow through broken stained glass "
            "windows. A faint red glow seeps from cracks in the floor. "
            "A crow perches on the remaining bell tower. The cross atop "
            "the steeple is bent at an unnatural angle. The atmosphere "
            "is oppressive and wrong. The border is made of cracked "
            "stonework and dead thorns. Dark greys and deep crimson."
        ),
    },
    {
        "id": 22,
        "file": "card-silver-wood.png",
        "name": "The Silver Wood",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "A forest of trees with bark like polished silver metal and "
            "leaves that shimmer between green and blue. A narrow path "
            "winds between the trees, lined with glowing mushrooms. "
            "Tiny lights — faerie sprites — drift between the branches. "
            "Time seems frozen: a falling leaf hangs motionless in midair. "
            "A distant arch of woven branches suggests a doorway to "
            "elsewhere. The border is silver birch bark with faerie knots. "
            "Silver, teal, and moonlight blue palette."
        ),
    },
    {
        "id": 23,
        "file": "card-hidden-cave.png",
        "name": "A Hidden Cave",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "The entrance to a deep cave in a cliff face, half-hidden by "
            "hanging ivy. Inside, the walls glitter with crystallized vis — "
            "points of purple, blue, and gold light embedded in dark rock. "
            "A stone table carved by ancient hands sits in the chamber. "
            "Stalactites drip with luminous water. The air itself seems to "
            "shimmer with power. The border is formed from rough crystal "
            "formations and cave minerals. Deep indigo and amethyst palette."
        ),
    },

    # ===== MYSTERIES =====
    {
        "id": 24,
        "file": "card-artifice.png",
        "name": "The Verdant Artifice of Verditius",
        "group": "Mystery",
        "prompt": MASTER_PREFIX + (
            "A master craftsman's workbench seen from above, covered with "
            "magical tools — a golden hammer, silver tongs, a set of "
            "inscribed chisels. At the center, a half-finished amulet "
            "glows with trapped lightning. Diagrams of enchantment circles "
            "are pinned to the wall behind. Metal shavings curl like "
            "calligraphy on the bench surface. The border is formed from "
            "interlocking gears, cogs, and forge tools. "
            "Warm copper, bronze, and forge-orange palette."
        ),
    },
    {
        "id": 25,
        "file": "card-arcadia.png",
        "name": "The Path of Arcadia",
        "group": "Mystery",
        "prompt": MASTER_PREFIX + (
            "A ring of mushrooms forming a perfect circle on a moonlit meadow, "
            "and within the ring the grass is a different color — more vivid, "
            "more alive. A translucent doorway of woven starlight stands "
            "within the ring, showing a glimpse of an impossible landscape "
            "beyond — floating islands, inverted waterfalls, two moons. "
            "Fireflies spell out words in an unknown script. The border "
            "is woven from wild roses and thorns with tiny hidden faces. "
            "Moonlight silver and enchanted green palette."
        ),
    },

    # ===== COMPANIONS =====
    {
        "id": 26,
        "file": "card-wandering-magus.png",
        "name": "A Wandering Magus",
        "group": "Companion",
        "prompt": MASTER_PREFIX + (
            "An elderly robed scholar walking a lonely road at dusk, "
            "carrying a gnarled staff topped with a faintly glowing crystal. "
            "His robes are deep blue embroidered with silver thread in "
            "arcane patterns. His face is weathered but his eyes burn with "
            "inner light — the eyes of one who has seen centuries. "
            "A raven perches on his shoulder. Behind him, a distant tower. "
            "The border is formed from intertwined serpents and stars."
        ),
    },
    {
        "id": 27,
        "file": "card-hedge-witch.png",
        "name": "A Hedge Witch",
        "group": "Companion",
        "prompt": MASTER_PREFIX + (
            "A woman crouched over a bubbling cauldron in a forest clearing, "
            "stirring with a wooden ladle. Dried herbs hang from branches "
            "above her. She wears a rough wool shawl and her wild grey hair "
            "is adorned with small bones and feathers. A black cat watches "
            "from nearby. Smoke from the cauldron forms shapes — a bird, "
            "a face, a hand. The border is woven from dried herbs and roots. "
            "Earthy brown and deep green palette."
        ),
    },
    {
        "id": 28,
        "file": "card-faithful-grog.png",
        "name": "A Faithful Grog",
        "group": "Companion",
        "prompt": MASTER_PREFIX + (
            "A sturdy medieval soldier standing guard beside a heavy wooden "
            "door. He wears a simple chainmail hauberk and carries a spear. "
            "His face is honest and square-jawed, showing loyalty rather than "
            "intelligence. A ring of iron keys hangs at his belt. Behind him, "
            "the stone walls of a covenant. He does not understand magic "
            "but he does not flinch from it. The border is formed from "
            "chain links and iron studs. Grey steel and warm ochre palette."
        ),
    },
    {
        "id": 29,
        "file": "card-curious-youth.png",
        "name": "A Curious Youth",
        "group": "Companion",
        "prompt": MASTER_PREFIX + (
            "A young man in a threadbare tunic peering through a keyhole, "
            "his eye wide with wonder. Through the keyhole, golden light "
            "and strange symbols spill out. He holds a half-eaten apple in "
            "one hand and a stolen scroll in the other. His expression is "
            "a mixture of awe, fear, and irresistible curiosity. "
            "The border is formed from question marks and keyholes. "
            "Warm amber and youthful green palette."
        ),
    },

    # ===== THREATS =====
    {
        "id": 30,
        "file": "card-curious-priest.png",
        "name": "A Curious Priest",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A thin-faced Catholic priest in black cassock writing in a ledger "
            "by candlelight. His quill scratches across the page — he is "
            "recording names and accusations. A crucifix hangs prominently "
            "at his chest. His smile is cold and knowing. Through the window "
            "behind him, a village church steeple. The border is formed from "
            "thorny vines wrapped around crosses. Dark grey and "
            "candlelight yellow palette."
        ),
    },
    {
        "id": 31,
        "file": "card-infernal-whisper.png",
        "name": "Whispers of the Infernal",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A beautiful androgynous face half-hidden in shadow, one eye "
            "glowing deep red. The visible half is impossibly perfect; the "
            "shadowed half hints at horns and scales. A forked tongue "
            "extends, dripping golden honey. One elegant hand extends, "
            "offering a glowing contract written in burning script. "
            "The border is formed from thorns and writhing serpents. "
            "Deep crimson and black with seductive gold accents."
        ),
    },
    {
        "id": 32,
        "file": "card-quaesitor.png",
        "name": "The Quaesitor's Gaze",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A stern magus in dark judicial robes holding a staff of office, "
            "standing in judgment. His eyes glow faintly blue — he sees "
            "through deception. Behind him, scales of justice hang in "
            "perfect balance. Runic seals of the Order of Hermes "
            "float in the air around him. He represents law absolute. "
            "The border is formed from chains and legal seals. "
            "Midnight blue and silver palette."
        ),
    },
    {
        "id": 33,
        "file": "card-twilight-beckons.png",
        "name": "Twilight Beckons",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A robed figure dissolving into pure white light within a "
            "great mandorla shape. The figure's outline fragments into "
            "geometric particles that drift upward. The expression on "
            "the dissolving face is ecstatic terror — beauty and "
            "annihilation are the same thing. Stars are visible through "
            "the translucent body. The border fragments and dissolves "
            "at the top. White, violet, and gold palette."
        ),
    },

    # ===== SPELLS =====
    {
        "id": 34,
        "file": "card-pilum-of-fire.png",
        "name": "Pilum of Fire",
        "group": "Spell",
        "prompt": MASTER_PREFIX + (
            "A lance of white-hot flame erupting from an outstretched hand, "
            "streaking across a dark battlefield. The fire takes the shape "
            "of a Roman javelin — the pilum. Where it strikes, stone "
            "explodes into molten fragments. The caster's silhouette "
            "is backlit by the flames. The border is scorched and burning "
            "at the edges. Intense orange, white-hot, and deep red palette."
        ),
    },
    {
        "id": 35,
        "file": "card-aegis-of-the-hearth.png",
        "name": "Aegis of the Hearth",
        "group": "Spell",
        "prompt": MASTER_PREFIX + (
            "A shimmering dome of translucent golden light covering a "
            "medieval stone tower and its surrounding buildings — a covenant. "
            "The dome's surface is inscribed with slowly rotating "
            "protective sigils. Outside the dome, dark shadows press "
            "against it but cannot enter. Inside, warm firelight glows "
            "from windows. The border is formed from interlocking "
            "shield shapes. Warm gold and protective blue palette."
        ),
    },
    {
        "id": 36,
        "file": "card-veil-of-invisibility.png",
        "name": "Veil of Invisibility",
        "group": "Spell",
        "prompt": MASTER_PREFIX + (
            "An empty stone corridor where a human figure is barely visible — "
            "outlined only by faint shimmer lines like heat haze. Footprints "
            "appear in the dust with no visible feet. A dropped goblet "
            "hangs in midair. Light bends strangely around the absent form. "
            "The border fades in and out of visibility, partially transparent. "
            "Subtle silver, grey-blue, and phantom white palette."
        ),
    },

    # ===== CONDITIONS =====
    {
        "id": 37,
        "file": "card-parma-magica.png",
        "name": "Parma Magica",
        "group": "Condition",
        "prompt": MASTER_PREFIX + (
            "A translucent shield of shimmering force hovering before a "
            "robed magus, deflecting incoming bolts of multi-colored energy. "
            "The shield is inscribed with the seal of Bonisagus. Sparks "
            "scatter where hostile spells strike the barrier. The magus "
            "stands calm and untouched behind the protection. "
            "The border is formed from interlocking defensive runes. "
            "Protective blue and silver with gold seal palette."
        ),
    },
    {
        "id": 38,
        "file": "card-twilight-scar.png",
        "name": "Twilight Scar",
        "group": "Condition",
        "prompt": MASTER_PREFIX + (
            "A close-up of a human hand with veins that glow faintly blue "
            "beneath the skin. The fingertips trail small motes of light. "
            "A crack in reality — a thin luminous line — hovers just above "
            "the palm. The hand is marked by the Twilight: changed forever, "
            "neither wounded nor healed, simply other. "
            "The border is cracked like broken glass with light leaking through. "
            "Pale blue, silver, and skin-tone palette."
        ),
    },

    # ===== LOCATIONS =====
    {
        "id": 39,
        "file": "card-crossroads-inn.png",
        "name": "The Crossroads Inn",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "A ramshackle medieval inn at a crossroads, warm firelight spilling "
            "from its windows into the rainy night. A wooden sign creaks in "
            "the wind — its painted image too faded to read. Travelers' horses "
            "are tied outside. A cloaked figure approaches through the mud. "
            "The inn is a place of rumor, trade, and secrets overheard. "
            "The border is formed from road signs and tankards. "
            "Warm amber, rain-grey, and firelight palette."
        ),
    },
    {
        "id": 40,
        "file": "card-covenant-ruins.png",
        "name": "Ruins of a Covenant",
        "group": "Location",
        "prompt": MASTER_PREFIX + (
            "Crumbling stone towers overgrown with ivy, the remains of a "
            "once-great magical covenant. A collapsed library spills books "
            "across rubble. Faint magical aura shimmers like heat haze over "
            "the ruins. A single intact doorway stands — its lintel carved "
            "with the seal of the Order. Whatever destroyed this place "
            "left scorch marks that still glow faintly. "
            "The border is formed from broken masonry and scattered pages. "
            "Grey stone, ivy green, and ghost-light palette."
        ),
    },

    # ===== RESOURCES =====
    {
        "id": 41,
        "file": "card-silver-penny.png",
        "name": "Silver Penny",
        "group": "Resource",
        "prompt": MASTER_PREFIX + (
            "A small pile of medieval silver coins on a rough wooden table, "
            "illuminated by a single candle. The coins bear the faded profile "
            "of a king. A leather purse lies open beside them. One coin "
            "is propped upright, catching the light. Simple wealth in a "
            "world where magic is the true currency. "
            "The border is formed from interlocking coins and purse clasps. "
            "Silver, warm wood, and candlelight palette."
        ),
    },
    {
        "id": 42,
        "file": "card-generic-text.png",
        "name": "Hermetic Text",
        "group": "Text",
        "prompt": MASTER_PREFIX + (
            "A stack of leather-bound books and rolled scrolls on a scholar's "
            "desk. The topmost book is open, showing dense Latin text with "
            "marginalia in red ink. A magnifying lens rests on one page. "
            "Bookmarks of different colored ribbons protrude from several "
            "volumes. An inkwell and quill stand ready. Dust motes float "
            "in a beam of light from an unseen window. "
            "The border is formed from book spines and scroll ends. "
            "Rich leather brown and parchment cream palette."
        ),
    },
    {
        "id": 43,
        "file": "card-generic-spell.png",
        "name": "Formulaic Spell",
        "group": "Spell",
        "prompt": MASTER_PREFIX + (
            "Two hands raised in a casting gesture, palms outward, fingers "
            "spread. Between the hands, a complex geometric sigil forms "
            "from lines of golden light — a spell taking shape. Energy "
            "crackles along the caster's forearms. The sigil rotates slowly, "
            "each line precise and deliberate. Latin words of power float "
            "as glowing text around the formation. "
            "The border is formed from arcane circles and spell diagrams. "
            "Gold, violet, and midnight blue palette."
        ),
    },

    # ===== REMAINING RESOURCES =====
    {
        "id": 44,
        "file": "card-vigor.png",
        "name": "Your Vigor",
        "group": "Resource",
        "prompt": MASTER_PREFIX + (
            "A muscular forearm gripping a wooden staff, veins visible "
            "beneath the skin, radiating warm golden vitality. A heartbeat "
            "pulse ripples outward as visible concentric rings of warm light. "
            "Behind the arm, a sunrise over green hills. The border is "
            "formed from braided sinew and oak branches bearing acorns. "
            "Warm flesh tones, sunrise gold, and living green palette."
        ),
    },
    {
        "id": 45,
        "file": "card-acumen.png",
        "name": "Your Acumen",
        "group": "Resource",
        "prompt": MASTER_PREFIX + (
            "A human eye viewed in extreme close-up, the iris containing "
            "tiny reflections of mathematical formulae, Latin text, and "
            "geometric diagrams. The pupil glows with soft blue-white "
            "intellectual light. Around the eye, orbiting symbols of "
            "logic — gears, compasses, astrolabes. The border is formed "
            "from interlocking puzzle pieces and compass arcs. "
            "Cool blue, silver, and parchment palette."
        ),
    },
    {
        "id": 46,
        "file": "card-fervor.png",
        "name": "Your Fervor",
        "group": "Resource",
        "prompt": MASTER_PREFIX + (
            "A clenched fist raised skyward, wreathed in flames that do "
            "not burn the skin. The flames are deep crimson and gold, "
            "spiraling upward with passionate energy. Behind the fist, "
            "a blood-red sky at dusk. Lightning forks in the distance. "
            "The border is formed from leaping flames and thorny roses. "
            "Deep crimson, burning orange, and passionate gold palette."
        ),
    },
    {
        "id": 47,
        "file": "card-season-token.png",
        "name": "A Season's Labor",
        "group": "Resource",
        "prompt": MASTER_PREFIX + (
            "A medieval hourglass with golden sand falling, set against "
            "a background divided into four quadrants — spring flowers, "
            "summer sun, autumn leaves, winter snow. The hourglass frame "
            "is ornately carved wood with zodiac symbols. Time is precious "
            "and finite. The border is formed from calendar wheels and "
            "seasonal motifs. Gold, green, amber, and ice-blue palette."
        ),
    },

    # ===== REMAINING THREATS =====
    {
        "id": 48,
        "file": "card-warping-tremor.png",
        "name": "A Warping Tremor",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A human hand held up before the viewer, but reality around it "
            "is cracking — fine luminous fissures spread through the air "
            "like broken glass. Through the cracks, strange other-light "
            "bleeds through in violet and white. The hand itself ripples "
            "as if reflected in disturbed water. The border fractures and "
            "warps at the edges. Violet, fractured white, and skin-tone palette."
        ),
    },
    {
        "id": 49,
        "file": "card-suspicious-villagers.png",
        "name": "Suspicious Villagers",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A group of medieval villagers seen from behind a fence, their "
            "faces suspicious and hostile. They carry torches and pitchforks. "
            "A woman makes the sign against the evil eye. A child hides "
            "behind her mother's skirt. In the background, a church steeple. "
            "The mob is gathering courage. The border is formed from "
            "rough-hewn fence posts and iron nails. "
            "Torchlight orange, angry red, and village brown palette."
        ),
    },
    {
        "id": 50,
        "file": "card-rival-magus.png",
        "name": "A Rival Magus",
        "group": "Threat",
        "prompt": MASTER_PREFIX + (
            "A rival wizard in dark robes, arms crossed, staring directly "
            "at the viewer with cold challenge. One hand crackles with "
            "restrained magical energy. His expression is contemptuous "
            "and confident. Behind him, his own covenant tower rises. "
            "A sigil of House Tytalus glows on his brooch. The border "
            "is formed from dueling swords and competing arcane symbols. "
            "Dark emerald green, threatening purple, and steel grey palette."
        ),
    },

    # ===== REMAINING ITEMS =====
    {
        "id": 51,
        "file": "card-enchanted-ring.png",
        "name": "Enchanted Items",
        "group": "Item",
        "prompt": MASTER_PREFIX + (
            "A collection of magical artifacts arranged on dark velvet — "
            "a copper ring set with a glowing garnet, a carved wooden wand "
            "inscribed with runes, and an unfinished amulet of silver. "
            "Each item pulses with faint inner light. Tiny arcane sigils "
            "float above each object. The border is formed from jeweler's "
            "tools and enchantment circles. "
            "Rich copper, silver, garnet red, and deep velvet palette."
        ),
    },
    {
        "id": 52,
        "file": "card-longevity-ritual.png",
        "name": "Longevity Ritual",
        "group": "Condition",
        "prompt": MASTER_PREFIX + (
            "An ornate golden chalice filled with luminous elixir — the "
            "liquid glows with shifting colors of amber, rose, and silver. "
            "Around the chalice, symbols of eternal youth and arrested time — "
            "an ouroboros, a phoenix feather, a frozen hourglass. The chalice "
            "sits on an altar draped in purple cloth. The border is formed "
            "from vine patterns that never wither. "
            "Liquid gold, elixir rose, and eternal purple palette."
        ),
    },

    # ===== VERB STATION ART =====
    # These use the same square format — will be displayed as backgrounds
    {
        "id": 53,
        "file": "verb-study.png",
        "name": "Study Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "A scholar's desk viewed from above, covered with open books, "
            "scrolls, an inkwell, a magnifying glass, and a guttering candle. "
            "The desk surface is dark oak stained with decades of ink. "
            "One book lies open to a page of arcane diagrams. A pair of "
            "reading spectacles rests on a page. The scene radiates quiet "
            "concentration and the pursuit of forbidden knowledge. "
            "The border is formed from stacked book spines. "
            "Warm candlelight, dark oak, and parchment palette."
        ),
    },
    {
        "id": 54,
        "file": "verb-work.png",
        "name": "Work Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "A wizard's laboratory workbench with bubbling alembics, "
            "a mortar and pestle, and a chalk circle drawn on the floor. "
            "Glowing liquid drips between glass vessels connected by copper "
            "tubes. A crucible glows with molten metal. Arcane diagrams "
            "cover the wall behind. Sparks fly from an enchantment in "
            "progress. The border is formed from alchemical symbols "
            "and laboratory equipment. "
            "Forge orange, glass blue, and copper palette."
        ),
    },
    {
        "id": 55,
        "file": "verb-dream.png",
        "name": "Dream Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "A crescent moon and stars over a dark landscape. "
            "Celestial light pours down in golden rays. "
            "Geometric alchemical symbols float among the stars. "
            "Deep midnight blue and gold palette."
        ),
    },
    {
        "id": 56,
        "file": "verb-explore.png",
        "name": "Explore Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "A cloaked traveler walking alone on a winding forest path "
            "at twilight. The path forks ahead into three directions — "
            "one toward distant mountains, one into dark woods, one "
            "toward a village with a church steeple. A compass rose "
            "glows faintly at the traveler's belt. Mist curls between "
            "ancient trees. The border is formed from winding paths "
            "and milestone markers. "
            "Dusk purple, forest green, and mist grey palette."
        ),
    },
    {
        "id": 57,
        "file": "verb-speak.png",
        "name": "Speak Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "Two figures seated across from each other at a rough "
            "tavern table, leaning close in conspiratorial conversation. "
            "One wears a hooded robe (a wizard in disguise), the other "
            "is a merchant or informant. A tankard and scattered coins "
            "rest between them. Shadows conceal their faces. "
            "The border is formed from whispered words and coin stacks. "
            "Warm tavern amber, shadow brown, and candlelight palette."
        ),
    },
    {
        "id": 58,
        "file": "verb-time.png",
        "name": "Time Passes Station",
        "group": "Verb",
        "prompt": MASTER_PREFIX + (
            "A great medieval clock mechanism — gears, pendulum, and "
            "a sundial — superimposed over a landscape showing all four "
            "seasons simultaneously: spring flowers, summer wheat, autumn "
            "leaves, and winter snow, each in one quadrant. The clock "
            "hands are made of gold. An hourglass sits at the center. "
            "Time is inescapable. The border is formed from calendar "
            "pages and zodiac symbols. "
            "Gold, seasonal greens and browns, and clock bronze palette."
        ),
    },

    # =================================================================
    #  EXPANSION — Mystery Paths
    # =================================================================
    {
        "id": 59,
        "file": "card-necromancy.png",
        "name": "The Necromantic Path",
        "group": "Mystery-Expansion",
        "prompt": MASTER_PREFIX + (
            "A robed scholar standing before a great stone sarcophagus, "
            "lifting the lid to reveal ghostly green light streaming upward. "
            "Spectral skulls and disembodied hands float in a ring around the figure. "
            "The ground is scattered with grave-dirt and withered lilies. "
            "A crescent moon shines sickly green overhead. "
            "The border is woven from bones and funerary herbs. "
            "Palette: sickly green, ashen grey, bone white, deep violet shadow."
        ),
    },
    {
        "id": 60,
        "file": "card-runes.png",
        "name": "The Path of Runes",
        "group": "Mystery-Expansion",
        "prompt": MASTER_PREFIX + (
            "A massive standing stone carved with intricate Nordic runes that glow "
            "with inner amber light. A cloaked hand reaches out to trace one rune, "
            "and where the finger touches, golden sparks fly. The stone stands "
            "in a field of snow under the aurora borealis. "
            "Smaller rune-carved stones form a circle around the central monolith. "
            "The border is formed from interlocking rune symbols. "
            "Palette: amber gold, ice blue, aurora green, slate grey, snow white."
        ),
    },
    {
        "id": 61,
        "file": "card-hymns.png",
        "name": "Hyperborean Hymns",
        "group": "Mystery-Expansion",
        "prompt": MASTER_PREFIX + (
            "A figure in flowing white robes standing atop a frozen mountain peak, "
            "mouth open in song. Visible sound waves radiate outward as golden spirals "
            "that shatter ice crystals into prismatic light. The sky is filled with "
            "northern lights responding to the hymn. Ancient Greek letters float in "
            "the air like musical notes. A lyre made of ice and gold sits nearby. "
            "The border is formed from musical staves and frozen vines. "
            "Palette: ice white, gold, aurora violet, crystalline blue."
        ),
    },
    {
        "id": 62,
        "file": "card-body-mystery.png",
        "name": "The Mystery of the Body",
        "group": "Mystery-Expansion",
        "prompt": MASTER_PREFIX + (
            "A muscular figure in a meditative pose, half-human half-transformed — "
            "one arm rippling with stone texture, the other wreathed in flame. "
            "The figure's eyes glow with inner power. Anatomical drawings in "
            "Leonardo da Vinci style float around the body showing muscles and bones "
            "overlaid with magical sigils. A golden aura surrounds the figure. "
            "The border is formed from intertwined sinew and vine. "
            "Palette: warm flesh tones, burnished gold, deep crimson, earth brown."
        ),
    },
    {
        "id": 63,
        "file": "card-strife.png",
        "name": "The Path of Strife",
        "group": "Mystery-Expansion",
        "prompt": MASTER_PREFIX + (
            "Two robed magi locked in arcane combat — one wielding a staff of fire, "
            "the other a shield of crystalline ice. Lightning crackles between them. "
            "The ground beneath their feet is scorched and frozen simultaneously. "
            "Chess pieces carved from obsidian and ivory are scattered on a "
            "battlefield below. A war banner with arcane symbols flies overhead. "
            "The border is formed from crossed swords and lightning bolts. "
            "Palette: crimson, electric blue, obsidian black, war-gold."
        ),
    },

    # =================================================================
    #  EXPANSION — Companions
    # =================================================================
    {
        "id": 64,
        "file": "card-crusader-knight.png",
        "name": "Crusader Knight",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A stern knight in battered Crusader armor — white surcoat with a red cross "
            "over chainmail. He kneels before a reliquary box that glows with holy light. "
            "His face is weathered and scarred, eyes haunted but resolute. "
            "A longsword rests across his knees. Desert sand and Jerusalem's walls "
            "are visible in the background. A faint golden halo hovers just above his head. "
            "The border is formed from heraldic shields and crossed swords. "
            "Palette: red cross on white, burnished steel, Jerusalem gold, desert tan."
        ),
    },
    {
        "id": 65,
        "file": "card-faerie-changeling.png",
        "name": "Faerie Changeling",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "An otherworldly child-like figure with pointed ears and too-bright eyes, "
            "sitting cross-legged on a toadstool in a moonlit fairy ring. "
            "Tiny wings like a dragonfly shimmer behind their back. One hand holds "
            "a flower that is simultaneously blooming and wilting. Fireflies and "
            "will-o-wisps orbit them. Their shadow doesn't match their form — "
            "it shows something older, taller, stranger. "
            "The border is formed from twisted fairy-tale thorns and moth wings. "
            "Palette: moonlit silver, fey green, twilight purple, will-o-wisp gold."
        ),
    },
    {
        "id": 66,
        "file": "card-ghostly-scholar.png",
        "name": "Ghostly Scholar",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A translucent spectral figure in ancient Roman robes, floating above "
            "a pile of dusty scrolls in a candlelit library. Their form flickers "
            "between solid and transparent. They hold a quill that writes "
            "by itself on ghostly parchment. Books orbit them slowly. "
            "Their expression is one of deep concentration and eternal patience. "
            "Cobwebs connect them to the physical books below. "
            "The border is formed from scrollwork and spectral wisps. "
            "Palette: ethereal blue-white, candlelight amber, dusty parchment, shadow grey."
        ),
    },
    {
        "id": 67,
        "file": "card-repentant-diabolist.png",
        "name": "Repentant Diabolist",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A gaunt figure in a dark hooded robe, face hidden in shadow except "
            "for one glowing red eye. Their hands are clasped in prayer but bear "
            "burn scars in the shape of infernal sigils. A broken pentagram "
            "lies shattered at their feet. Behind them, a demonic shadow "
            "reaches for them but is held back by a thin golden chain of faith. "
            "A single white lily grows from the cracked pentagram. "
            "The border is formed from broken chains and prayer beads. "
            "Palette: penitent black, infernal red, redemption gold, lily white."
        ),
    },
    {
        "id": 68,
        "file": "card-runecaster.png",
        "name": "Norse Runecaster",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A weathered Norse woman with braided grey hair, sitting by a fire "
            "and casting rune-carved bones from a leather pouch. The runes "
            "glow amber as they tumble through the air. She wears wolf pelts "
            "and bone jewelry. Behind her, a great ash tree (Yggdrasil) rises "
            "into a star-filled sky. A raven perches on her shoulder. "
            "The border is formed from Norse knotwork and rune bands. "
            "Palette: fire amber, wolf grey, ash bark brown, starlight silver."
        ),
    },
    {
        "id": 69,
        "file": "card-travelling-merchant.png",
        "name": "Travelling Merchant",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A rotund merchant in colorful Moorish robes, seated on cushions "
            "in a market stall overflowing with exotic goods — glowing crystals, "
            "strange herbs in jars, a monkey on a chain, rolled carpets, and "
            "brass lamps. He grins knowingly and holds up a vial of something "
            "that shimmers with inner light. Gold coins are stacked around him. "
            "A map of trade routes is pinned to the stall's canopy. "
            "The border is formed from trade goods and exotic textiles. "
            "Palette: Moorish turquoise, merchant gold, spice saffron, carpet crimson."
        ),
    },
    {
        "id": 70,
        "file": "card-hungry-familiar.png",
        "name": "Hungry Familiar",
        "group": "Companion-Expansion",
        "prompt": MASTER_PREFIX + (
            "A large, intelligent-looking cat with too many eyes — one pair "
            "normal, additional pairs along its brow glowing faintly green. "
            "It sits on an open grimoire, its tail curled around a crystal vial. "
            "The cat is sleek and black with silver-tipped fur. Around it, "
            "half-eaten enchanted items and gnawed spell components litter "
            "the floor. It stares directly at the viewer with unnerving intelligence. "
            "The border is formed from cat silhouettes and arcane symbols. "
            "Palette: midnight black, eldritch green eyes, silver moonlight, grimoire brown."
        ),
    },

    # =================================================================
    #  EXPANSION — Locations
    # =================================================================
    {
        "id": 71,
        "file": "card-basilica-columns.png",
        "name": "Basilica of Columns",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "An ancient Roman basilica with rows of massive marble columns stretching "
            "into darkness. Between the columns, faint ghostly figures of Roman "
            "senators debate silently. The floor is a mosaic of arcane patterns. "
            "Candles float in midair along the colonnade. At the far end, "
            "a marble throne sits empty, bathed in a shaft of golden light "
            "from a crack in the vaulted ceiling. "
            "The border is formed from Corinthian column capitals and laurel wreaths. "
            "Palette: marble white, ancient gold, shadow violet, mosaic blue-red."
        ),
    },
    {
        "id": 72,
        "file": "card-pompeii-regio.png",
        "name": "Pompeii Regio",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "The ruins of Pompeii half-buried in volcanic ash, but with a "
            "shimmering magical boundary visible in the air — on one side, "
            "grey ruins; on the other, the city alive and burning, frozen "
            "in the moment of Vesuvius's eruption. Lava flows glow orange. "
            "Ghost-like figures of fleeing citizens are trapped between both realities. "
            "Mount Vesuvius smokes ominously in the background. "
            "The border is formed from volcanic rock and Roman mosaics. "
            "Palette: volcanic orange, ash grey, lava red, Pompeii fresco blue."
        ),
    },
    {
        "id": 73,
        "file": "card-garden-hesperides.png",
        "name": "Garden of the Hesperides",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "A magical garden of impossible beauty — trees bearing golden apples "
            "glow with inner light. A dragon with iridescent scales coils lazily "
            "around the central tree. Three ethereal nymph-like figures tend "
            "the garden in flowing robes. A fountain of liquid starlight burbles "
            "at the center. The sky is perpetual sunset in gold and rose. "
            "Exotic flowers bloom in impossible colors. "
            "The border is formed from golden apple branches and dragon scales. "
            "Palette: golden apple, sunset rose, dragon iridescent, eternal green."
        ),
    },
    {
        "id": 74,
        "file": "card-witch-endor.png",
        "name": "Cave of the Witch of En-Dor",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "A dark cave entrance framed by ancient olive trees. Inside the cave, "
            "a cauldron bubbles with green fire. Ghostly figures rise from the "
            "smoke — the shade of a crowned king (King Saul). The cave walls "
            "are carved with Hebrew letters and necromantic symbols. "
            "A skeletal hand reaches up from the earth. Bats cluster on the ceiling. "
            "The entrance is framed by a natural stone arch like a gaping mouth. "
            "The border is formed from Hebrew script and bone fragments. "
            "Palette: cave black, necromantic green, ghost white, olive wood brown."
        ),
    },
    {
        "id": 75,
        "file": "card-sacred-grove.png",
        "name": "Sacred Grove of Dindymene",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "An ancient grove of enormous oak trees with faces in their bark. "
            "A stone altar covered in moss sits at the center, stained with "
            "centuries of offerings. Druids in white robes circle the grove "
            "in a spectral procession. Mistletoe glows golden on the highest branches. "
            "Deer with silver antlers watch from the shadows. A spring of "
            "crystal-clear water flows from beneath the altar stone. "
            "The border is formed from oak leaves, acorns, and mistletoe. "
            "Palette: deep forest green, druid white, altar moss, golden mistletoe."
        ),
    },
    {
        "id": 76,
        "file": "card-sunken-library.png",
        "name": "The Sunken Library",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "An underwater library — towering shelves of books and scrolls "
            "submerged in crystal-clear turquoise water. Fish swim between "
            "the shelves. Air bubbles rise from enchanted reading desks where "
            "ghostly scholars still study. Coral grows over ancient marble pillars. "
            "A shaft of sunlight penetrates from above, illuminating a golden "
            "lectern holding an open book whose pages flutter in the current. "
            "The border is formed from coral, seashells, and waterlogged scrolls. "
            "Palette: deep ocean turquoise, coral pink, sunlit gold, pearl white."
        ),
    },
    {
        "id": 77,
        "file": "card-dragons-hoard.png",
        "name": "The Dragon's Hoard",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "A vast underground cavern filled with mountains of gold coins, "
            "jeweled crowns, magical weapons, and enchanted artifacts. "
            "A great dragon's eye — amber with a vertical pupil — peers "
            "from the darkness at the top. Dragon scales glitter where they "
            "are half-buried in the treasure. Smoke curls from unseen nostrils. "
            "The light comes from glowing gems embedded in the cave walls. "
            "The border is formed from dragon scales and treasure coins. "
            "Palette: treasure gold, dragon amber, gem ruby-emerald, cave shadow."
        ),
    },
    {
        "id": 78,
        "file": "card-apollos-sanctuary.png",
        "name": "Apollo's Sanctuary",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "A sun-drenched Greek temple with perfect white marble columns "
            "and a golden roof. A statue of Apollo holding a golden lyre "
            "stands at the center, and actual sunlight streams from the "
            "statue's eyes. An oracle sits on a tripod over a fissure "
            "in the floor, breathing in prophetic vapors. Laurel trees "
            "surround the temple. The sky is impossibly blue. "
            "The border is formed from laurel wreaths and sun rays. "
            "Palette: Apollonian gold, marble white, sky blue, laurel green."
        ),
    },
    {
        "id": 79,
        "file": "card-purgatory-pass.png",
        "name": "Purgatory Pass",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "A narrow mountain pass between towering cliffs, wreathed in "
            "perpetual mist and ghostly fire. Spectral figures climb the "
            "winding path upward, their forms becoming more luminous as they "
            "ascend. At the top, a blinding white light. At the bottom, "
            "dark red embers and shadow. Carved into the cliff face are "
            "the words of Dante (shown as illegible script). "
            "Stone steps wind upward endlessly. "
            "The border is formed from flames transitioning to stars. "
            "Palette: purgatorial orange, mist grey, ascending white, ember red."
        ),
    },
    {
        "id": 80,
        "file": "card-tower-babel.png",
        "name": "Tower of Babel Ruins",
        "group": "Location-Expansion",
        "prompt": MASTER_PREFIX + (
            "The shattered base of an impossibly large tower — only the "
            "first few stories remain, the rest broken off into the clouds. "
            "The architecture is a confused mixture of every ancient style: "
            "Babylonian, Egyptian, Greek, Persian. Fragments of different "
            "languages are carved into every surface. Workers' ghosts still "
            "carry bricks upward to nowhere. Storm clouds swirl above. "
            "The border is formed from brick fragments and scattered alphabets. "
            "Palette: Babylonian ochre, storm grey, ancient brick red, linguistic gold."
        ),
    },

    # =================================================================
    #  EXPANSION — Items
    # =================================================================
    {
        "id": 81,
        "file": "card-ring-warding.png",
        "name": "Ring of Warding",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A heavy silver ring set on a dark velvet cushion. The band is "
            "engraved with tiny protective sigils that glow faintly blue. "
            "A dome of translucent blue energy rises from the ring like a "
            "miniature force field. The ring casts no shadow — instead, shadow "
            "bends away from it. Small demons recoil at the edges of the image. "
            "The border is formed from protective ward circles and silver chains. "
            "Palette: warding silver-blue, protective gold, demon-shadow black, velvet deep blue."
        ),
    },
    {
        "id": 82,
        "file": "card-orb-divination.png",
        "name": "Orb of Divination",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A crystal sphere resting on an ornate bronze stand shaped like "
            "three entwined serpents. Inside the orb, swirling mist reveals "
            "fragmented visions: a castle, a face, a constellation. "
            "The seer's hands hover around the orb, not touching it. "
            "Light refracts through the crystal into rainbow patterns "
            "that form arcane symbols on the surrounding table. "
            "The border is formed from astrological symbols and crystal facets. "
            "Palette: crystal clear, vision purple, serpent bronze, rainbow prismatic."
        ),
    },
    {
        "id": 83,
        "file": "card-cloak-invisibility.png",
        "name": "Cloak of Invisibility",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A cloak draped over a wooden mannequin, but the mannequin is "
            "partially invisible where the cloak covers it — you can see "
            "the bookshelf behind it through the fabric. The visible edges "
            "of the cloak shimmer with a mother-of-pearl iridescence. "
            "The hem is embroidered with eyes that are all closed. "
            "Dust motes pass through where the body should be. "
            "The border is formed from eyes (open and closed) and vanishing patterns. "
            "Palette: pearl iridescence, invisible transparency, closed-eye gold, shadow grey."
        ),
    },
    {
        "id": 84,
        "file": "card-staff-elements.png",
        "name": "Staff of the Elements",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A tall wooden staff standing upright, its tip splitting into four "
            "branches, each wreathed in a different element: fire, water, earth, "
            "and air spiral around their respective branch. Where the elements "
            "meet at the staff's crown, they form a miniature storm of combined "
            "power. The staff's wood has grown with veins of each element. "
            "It stands planted in cracked earth, untouched. "
            "The border is formed from the four elements in each corner. "
            "Palette: flame red, ocean blue, earth brown, sky white, staff oak."
        ),
    },
    {
        "id": 85,
        "file": "card-longevity-elixir.png",
        "name": "Longevity Elixir",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A small crystal phial filled with a luminous golden-green liquid, "
            "sitting on a laboratory table surrounded by alchemical equipment. "
            "The liquid glows from within, casting the room in amber light. "
            "An ouroboros (snake eating its tail) is etched into the phial's stopper. "
            "On one side of the phial, a withered hand; on the other, a young hand "
            "reaching for it. Time seems frozen around the elixir. "
            "The border is formed from ouroboros snakes and hourglass sand. "
            "Palette: elixir gold-green, alchemical amber, eternal youth rose, time-sand beige."
        ),
    },
    {
        "id": 86,
        "file": "card-talisman-bonding.png",
        "name": "Talisman of Bonding",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "An intricate amulet made of interwoven gold and silver wire, "
            "set with a central stone that shifts color like a mood ring. "
            "Tiny chains of light connect the talisman to invisible points "
            "beyond the image's edge — the bonds it has formed. "
            "The amulet rests on a velvet cloth covered in arcane circles. "
            "Its reflection in the polished surface shows a different form "
            "than its physical shape — perhaps its true nature. "
            "The border is formed from chain links and binding knots. "
            "Palette: bond gold, connection silver, mood-stone shifting, velvet midnight."
        ),
    },
    {
        "id": 87,
        "file": "card-automaton-servant.png",
        "name": "Automaton Servant",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A mechanical humanoid figure made of brass and copper, standing "
            "at attention in a medieval workshop. Its chest cavity is open, "
            "revealing intricate clockwork gears and a glowing blue crystal heart. "
            "Its eyes are glass lenses that glow faintly. One hand holds a broom, "
            "the other a scroll — it serves both mundane and arcane needs. "
            "Tiny runes are etched into every joint and gear. "
            "The border is formed from clockwork gears and brass rivets. "
            "Palette: brass gold, copper warm, crystal-heart blue, workshop brown."
        ),
    },
    {
        "id": 88,
        "file": "card-necromancers-grimoire.png",
        "name": "Necromancer's Grimoire",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A thick black leather book bound with iron clasps shaped like "
            "skeletal hands. The cover is embossed with a skull whose eye "
            "sockets glow with pale green light. The book hovers slightly "
            "above the table, its pages riffling on their own. "
            "Ghostly text floats up from the open pages. The leather "
            "seems to breathe subtly. A chain anchors it to the reading desk. "
            "The border is formed from ghostly script and skeletal motifs. "
            "Palette: death black, ghost green, bone ivory, iron grey, page yellowed."
        ),
    },
    {
        "id": 89,
        "file": "card-travelling-lab.png",
        "name": "Travelling Laboratory",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A magical chest that has been opened to reveal an impossible "
            "interior — a full alchemical laboratory folded into a space "
            "the size of a trunk. Tiny retorts, alembics, and crucibles "
            "are racked neatly inside. A small fire burns impossibly within. "
            "The chest sits on a pack mule's back against a road backdrop. "
            "Glass vials of colored liquids catch the light. "
            "The border is formed from alchemical symbols and road cobblestones. "
            "Palette: leather trunk brown, alchemical glass colors, road-dust beige, fire amber."
        ),
    },
    {
        "id": 90,
        "file": "card-gargoyle-guardian.png",
        "name": "Gargoyle Guardian",
        "group": "Item-Expansion",
        "prompt": MASTER_PREFIX + (
            "A stone gargoyle perched on a Gothic cathedral parapet, wings "
            "half-spread, mouth open in a silent roar. Its eyes glow "
            "with amber magical light. Rain streams down its stony body. "
            "One clawed hand grips the parapet edge. Below, a medieval "
            "town sleeps peacefully under its watchful gaze. Lightning "
            "cracks behind it, briefly illuminating its full terrible form. "
            "The border is formed from Gothic architecture and stone tracery. "
            "Palette: stone grey, amber eyes, Gothic shadow, lightning white, rain silver."
        ),
    },

    # =================================================================
    #  EXPANSION — Technique-themed Spell Art
    # =================================================================
    {
        "id": 91,
        "file": "card-creo-spell.png",
        "name": "Creo Spell — Creation Magic",
        "group": "Spell-Expansion",
        "prompt": MASTER_PREFIX + (
            "A pair of hands cupped together, from which a miniature golden "
            "sun rises like a newborn star. Around the hands, flowers bloom "
            "from nothing, wounds heal on visible skin, and a small perfect "
            "crystal forms in midair. The magic is warm and generative. "
            "Golden light radiates outward in a mandala pattern. "
            "The hands are robed in green — the color of life. "
            "The border is formed from blooming flowers and healing sigils. "
            "Palette: creation gold, life green, healing warm white, crystal clarity."
        ),
    },
    {
        "id": 92,
        "file": "card-intellego-spell.png",
        "name": "Intellego Spell — Perception Magic",
        "group": "Spell-Expansion",
        "prompt": MASTER_PREFIX + (
            "A great eye — part human, part celestial — floating in a field "
            "of arcane symbols. Multiple layers of reality are visible through "
            "the eye like a lens: the physical world, the magical aura, and "
            "the spiritual realm layered on top of each other. "
            "Silver threads of information flow into the eye from all directions. "
            "A third eye on a forehead glows with blue light. "
            "The border is formed from overlapping circles and seeing-eye motifs. "
            "Palette: perception blue, silver thread, multi-layered translucent, wisdom violet."
        ),
    },
    {
        "id": 93,
        "file": "card-muto-spell.png",
        "name": "Muto Spell — Transformation Magic",
        "group": "Spell-Expansion",
        "prompt": MASTER_PREFIX + (
            "A figure mid-transformation — half human, half beast (wolf or eagle), "
            "captured in the exact moment of change. Flesh flows like liquid, "
            "feathers emerge from skin, bones reshape. The figure's expression "
            "is ecstatic, not pained. Swirling energies of green and gold "
            "spiral around the body. Below, a caterpillar and a butterfly "
            "mirror the transformation. "
            "The border is formed from morphing shapes and metamorphosis symbols. "
            "Palette: transformation green, flesh tone, beast brown, metamorphosis gold."
        ),
    },
    {
        "id": 94,
        "file": "card-perdo-spell.png",
        "name": "Perdo Spell — Destruction Magic",
        "group": "Spell-Expansion",
        "prompt": MASTER_PREFIX + (
            "A robed hand pointing downward, and where it points, the world "
            "crumbles to dust. A stone wall collapses into sand. A sword "
            "rusts and breaks. A flame gutters and dies. Entropy radiates "
            "from the fingertip as dark violet energy. The background "
            "shows a perfect world on one side and total decay on the other. "
            "A skull grins from within the dissolving matter. "
            "The border is formed from crumbling stone and decay patterns. "
            "Palette: entropy violet-black, decay brown, rust red, dust grey, bone white."
        ),
    },
    {
        "id": 95,
        "file": "card-rego-spell.png",
        "name": "Rego Spell — Control Magic",
        "group": "Spell-Expansion",
        "prompt": MASTER_PREFIX + (
            "A magus with arms outstretched, puppet-master-like, commanding "
            "objects and elements with invisible strings of blue light. "
            "Stones hover in precise formation, water flows upward in a "
            "controlled stream, fire burns in a perfect geometric shape. "
            "The magus stands in the center of a massive arcane circle "
            "inscribed on the ground. Everything is ordered, precise, geometric. "
            "The border is formed from geometric patterns and control sigils. "
            "Palette: command blue, control silver, geometric gold, ordered white."
        ),
    },
]

CHROME_PATHS = [
    r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
    os.path.join(os.environ.get("LOCALAPPDATA", ""), r"Google\Chrome\Application\chrome.exe"),
]

EDGE_PATHS = [
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
]

DEBUG_PROFILE_DIR = os.path.join(
    os.environ.get("LOCALAPPDATA", os.environ.get("TEMP", ".")),
    "chrome-copilot-debug-profile",
)


def find_browser():
    """Find Chrome or Edge on the system."""
    for path in CHROME_PATHS + EDGE_PATHS:
        if os.path.isfile(path):
            return path
    return None


def launch_chrome_debug(port=9222):
    """Kill existing Chrome, relaunch with debug port and a dedicated profile."""
    import subprocess

    browser_path = find_browser()
    if not browser_path:
        print("ERROR: Could not find Chrome or Edge on this system.")
        return False

    print(f"Found browser: {browser_path}")
    print(f"Debug profile dir: {DEBUG_PROFILE_DIR}")

    exe_name = os.path.basename(browser_path).replace(".exe", "")
    print(f"Stopping all {exe_name} processes...")
    subprocess.run(["taskkill", "/F", "/IM", f"{exe_name}.exe"], capture_output=True)
    time.sleep(3)

    print(f"Launching {exe_name} with --remote-debugging-port={port}...")
    subprocess.Popen(
        [browser_path, f"--remote-debugging-port={port}", f"--user-data-dir={DEBUG_PROFILE_DIR}"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    time.sleep(5)

    try:
        resp = urllib.request.urlopen(f"http://127.0.0.1:{port}/json/version", timeout=5)
        data = json.loads(resp.read())
        print(f"Connected: {data.get('Browser', 'unknown')}")
        return True
    except Exception:
        print(f"ERROR: Browser launched but port {port} is not responding.")
        return False


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

def get_args():
    p = argparse.ArgumentParser(description="Generate images via Copilot Image Creator")
    p.add_argument("--launch", action="store_true", help="Auto-launch Chrome with debug port (kills existing instances)")
    p.add_argument("--start", type=int, default=1, help="Start from prompt # (1-indexed)")
    p.add_argument("--only", type=int, default=None, help="Run only this prompt #")
    p.add_argument("--batch", type=int, default=None, help="Run only prompts from batch N (1 or 2)")
    p.add_argument("--delay", type=int, default=300, help="Base seconds between prompts (randomized ±40%%)")
    p.add_argument("--save-dir", type=str, default="./output/card-art", help="Output directory")
    p.add_argument("--cdp-url", type=str, default="http://127.0.0.1:9222", help="Chrome CDP endpoint")
    p.add_argument("--dry-run", action="store_true", help="Print prompts without submitting")
    p.add_argument("--no-prompt", action="store_true", help="Skip interactive prompts (for non-interactive terminals)")
    p.add_argument("--list", action="store_true", help="List all prompts and exit")
    return p.parse_args()


def list_prompts(batch=None):
    filtered = PROMPTS
    if batch is not None:
        filtered = [p for p in filtered if p.get("batch", 1) == batch]
    print(f"\n{'#':>3}  {'Batch':<6} {'Group':<12} {'Name':<30} File")
    print("-" * 90)
    for p in filtered:
        b = p.get("batch", 1)
        print(f"{p['id']:>3}  {b:<6} {p['group']:<12} {p['name']:<30} {p['file']}")
    print(f"\n{len(filtered)} scene prompts")
    print("\nCharacter-in-scene prompts (manual): docs/art/images-manual/")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    args = get_args()

    if args.list:
        list_prompts(batch=args.batch)
        return

    # Filter prompts
    if args.only:
        prompts = [p for p in PROMPTS if p["id"] == args.only]
        if not prompts:
            print(f"ERROR: No prompt with id #{args.only}")
            return
    else:
        prompts = [p for p in PROMPTS if p["id"] >= args.start]
        if args.batch is not None:
            prompts = [p for p in prompts if p.get("batch", 1) == args.batch]

    if args.dry_run:
        for p in prompts:
            print(f"\n{'='*70}")
            print(f"#{p['id']} — {p['group']} — {p['name']}")
            print(f"File: {p['file']}")
            print(f"{'='*70}")
            print(p["prompt"])
        print(f"\n{len(prompts)} prompts would be submitted.")
        return

    # Auto-launch Chrome if requested
    if args.launch:
        if not launch_chrome_debug():
            return
        print()
        print("Chrome is running with debug port.")
        print("Please sign in to https://copilot.microsoft.com/ in the Chrome window.")
        if not args.no_prompt:
            input("Press Enter here once you are signed in... ")
        else:
            print("(--no-prompt: skipping sign-in wait, proceeding in 10s...)")
            time.sleep(10)
        print()

    # Import playwright here so --list and --dry-run work without it
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("Playwright not installed. Run:")
        print("  pip install playwright")
        print("  playwright install chromium")
        print("\nFor now, use --dry-run or --list to preview prompts.")
        return

    os.makedirs(args.save_dir, exist_ok=True)

    print(f"Connecting to Chrome at {args.cdp_url} ...")
    print(f"(Make sure Chrome is running with --remote-debugging-port=9222)")
    print()

    with sync_playwright() as pw:
        try:
            browser = pw.chromium.connect_over_cdp(args.cdp_url)
        except Exception as e:
            print(f"ERROR: Could not connect to Chrome: {e}")
            print()
            print("Start Chrome with remote debugging:")
            print('  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222')
            print("  or for Edge:")
            print('  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe" --remote-debugging-port=9222')
            return

        context = browser.contexts[0]
        copilot_page = None
        for page in context.pages:
            if "copilot.microsoft.com" in page.url:
                copilot_page = page
                break

        if not copilot_page:
            print("No Copilot tab found. Opening one...")
            copilot_page = context.new_page()
            copilot_page.goto("https://copilot.microsoft.com/")
            copilot_page.wait_for_load_state("networkidle")
            print("Please sign in to Copilot in the browser, then press Enter here...")
            if not args.no_prompt:
                input()
            else:
                print("(--no-prompt: skipping sign-in wait, proceeding in 10s...)")
                time.sleep(10)

        print(f"Connected! Processing {len(prompts)} prompts.")
        print(f"Delay between prompts: ~{args.delay}s (randomized ±40%)")
        print()

        for i, p in enumerate(prompts):
            prompt_num = p["id"]
            print(f"[{i+1}/{len(prompts)}] #{prompt_num} — {p['group']} — {p['name']}")

            # Start a new chat for each image
            try:
                human_pause(1.5, 4.0, "navigating to Copilot")
                copilot_page.goto("https://copilot.microsoft.com/")
                copilot_page.wait_for_load_state("networkidle")
                human_pause(2.0, 5.0)
            except Exception as e:
                print(f"  WARNING: Navigation issue: {e}")
                human_pause(4.0, 8.0)

            # Find the text input
            try:
                textarea = copilot_page.locator("textarea").first
                textarea.wait_for(state="visible", timeout=15000)
            except Exception:
                try:
                    textarea = copilot_page.locator("[contenteditable='true']").first
                    textarea.wait_for(state="visible", timeout=10000)
                except Exception:
                    print(f"  ERROR: Could not find text input. Skipping.")
                    continue

            # Type the prompt
            human_pause(1.0, 3.0, "about to type prompt")
            human_type(textarea, p["prompt"])
            human_pause(1.0, 3.0, "reviewing before submit")

            # Submit
            try:
                submit_btn = copilot_page.locator("button[aria-label='Submit']").first
                if submit_btn.is_visible(timeout=3000):
                    human_pause(1.0, 3.0, "clicking submit")
                    submit_btn.click()
                else:
                    textarea.press("Enter")
            except Exception:
                textarea.press("Enter")

            print(f"  Submitted. Waiting for image generation...")

            # Wait for image
            image_saved = False
            try:
                dl_btn_selector = "button[data-testid='ai-image-download-button']"
                copilot_page.wait_for_selector(dl_btn_selector, timeout=120000)
                human_pause(2.0, 5.0, "image generated, preparing to download")

                dl_btn = copilot_page.locator(dl_btn_selector).first
                try:
                    human_pause(1.0, 3.0, "clicking download")
                    with copilot_page.expect_download(timeout=30000) as download_info:
                        dl_btn.click()
                    download = download_info.value
                    fpath = os.path.join(args.save_dir, p["file"])
                    download.save_as(fpath)
                    print(f"  Saved: {fpath}")
                    image_saved = True
                except Exception as e:
                    print(f"  Download button click failed: {e}")
                    print("  Trying fallback approach...")

                    img_selector = (
                        "img[src*='bing.com/images'], "
                        "img[src*='th.bing.com'], "
                        "img[src*='dalleprodsec'], "
                        "img[src*='copilot'], "
                        "div[data-content='ai-image'] img"
                    )
                    try:
                        first_img = copilot_page.locator(img_selector).first
                        human_pause(1.0, 3.0, "clicking image")
                        first_img.click()
                        human_pause(2.0, 4.0)

                        dl_btn2 = copilot_page.locator(dl_btn_selector).first
                        if dl_btn2.is_visible(timeout=5000):
                            human_pause(1.0, 3.0, "clicking download in expanded view")
                            with copilot_page.expect_download(timeout=30000) as download_info:
                                dl_btn2.click()
                            download = download_info.value
                            fpath = os.path.join(args.save_dir, p["file"])
                            download.save_as(fpath)
                            print(f"  Saved: {fpath}")
                            image_saved = True
                    except Exception as e2:
                        print(f"  Fallback also failed: {e2}")

                try:
                    copilot_page.keyboard.press("Escape")
                    time.sleep(0.5)
                except Exception:
                    pass

                if not image_saved:
                    fpath = os.path.join(args.save_dir, p["file"].replace(".png", "_screenshot.png"))
                    copilot_page.screenshot(path=fpath)
                    print(f"  No download found. Screenshot saved: {fpath}")

            except Exception as e:
                print(f"  WARNING: Timed out or error waiting for image: {e}")
                fpath = os.path.join(args.save_dir, p["file"].replace(".png", "_screenshot.png"))
                try:
                    copilot_page.screenshot(path=fpath)
                    print(f"  Screenshot saved: {fpath}")
                except Exception:
                    pass

            # Delay between prompts
            if i < len(prompts) - 1:
                wait = random_delay(args.delay)
                print(f"  Waiting {wait:.0f}s before next prompt (~{wait/60:.1f} min)...")
                time.sleep(wait)

        print(f"\nDone! {len(prompts)} prompts processed.")
        print(f"Images saved to: {os.path.abspath(args.save_dir)}")


if __name__ == "__main__":
    main()
