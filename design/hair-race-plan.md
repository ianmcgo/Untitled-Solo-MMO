# Per-race hair plan (reference: the user's character-model sheet, 8 faces x 3 colour variants per race and gender, plus a 9th barber-only face)

Race mapping: Human (both), Elari (both), Pipkin (both), Nekari (female only), Ursan (male only).
Today: CC_FACE_HAIR (main4.js) gives one hairstyle per face for each gender, shared by all races; HAIR_COLORS is one 8-colour list for everyone; 16 styles exist in HAIR_STYLES (rig.js).

## Target table (face -> hairstyle, the three colour variants, extras)
Existing style names in quotes; NEW marks a style to build.

Human male
1 shoulder-length straight, centre part - "long" (variant) | blond, brown, teal
2 short shaggy with fringe - NEW shaggy | black, gold, pink
3 tall upswept spikes - "spiky" | blond, copper, silver
4 medium tousled with bangs - NEW tousled | auburn, sandy, moss green
5 shaved, forehead tattoo, goatee - "bald" + tattoo + goatee | tattoo blue, black, red
6 short crop, headband, face paint - "short" + headband + face paint | dark browns
7 slicked back with full beard - NEW slickback + beard | brown, blond, grey
8 high topknot - "topknot" | black, blond, copper
9 (barber) crest with face markings and beard - "mohawk" + beard + markings

Human female
1 chin bob, blunt bangs - "bob" (bangs) | ginger, orange, rose red
2 long straight, centre part - "long" | blonde, black, pink
3 long side part - "sidepart" (longer) | brown, auburn, blue
4 short asymmetric bob - NEW asymbob | black, light brown, green
5 pulled back tight, low bun - NEW slickbun | blonde, copper, navy
6 side ponytail over the shoulder - NEW sidetail | black, brown, red
7 pixie crop - "pixie" | brown, blonde, black
8 shoulder-length layered, face-framing - NEW layered | auburn, red, wine
9 (barber) layered side-swept shag - layered variant

Elari male
1 long straight, centre part - "long" | silver, black, teal
2 long shaggy, bangs over eyes - NEW longshag | silver, black, red
3 short slicked back - NEW slickback | black, platinum, navy
4 slicked back, long tail down the back - slickback + "ponytail" (low, long) | white, black, maroon
5 swept back with long braid - slickback + "braid" | orange, white, brown
6 swept-back feathered spikes - NEW feathered | cream, orange, moss
7 messy fringe with a stray strand - NEW messy | cream, orange, wine
8 swept back with full beard - slickback + beard | white, black, plum
9 (barber) long swept back - "long" swept

Elari female
1 shoulder-length straight with bangs - "bob" long variant | cream, orange, pink
2 braided crown - NEW crownbraid | cream, black, pink
3 long side-swept over one shoulder, hair clip - "sidepart" + clip | cream, orange, brown
4 chin length, flipped ends, bangs - NEW flipbob | cream, orange, periwinkle
5 high bun with ornament - NEW highbun + ornament | silver, red, brown
6 long straight past the shoulders - "long" | silver, black, sage
7 long sleek, swept back - "long" swept | white, black, gold
8 long with blunt bangs - NEW hime | black, grey, plum
9 (barber) short bob, blunt bangs - "bob"

Pipkin male
1 bowl cut with a pointed peak - NEW bowlpeak | brown, peach, pale green
2 round shag with an antenna tuft - NEW tuft | orange, gold, aqua
3 small topknot bun - "topknot" (small) | brown, olive, maroon
4 bowl with long bangs over the eyes - NEW bowl | silver, lavender, aqua
5 teardrop peak cap - bowlpeak tall variant | brown, blue, white
6 spiky tuft - "spiky" short variant | orange, blue, green
7 tall pineapple bun - NEW pineapple | navy, gold, pink
8 bowl with side-swept bangs - bowl variant | blonde, gold, teal
9 (barber) bald - "bald"

Pipkin female
1 front poof with swept-up tail - NEW poof | red, gold, mint
2 blunt bob with side clips - "bob" + clips | grey, olive, teal
3 twin round buns - NEW odango | brown, red, green
4 low puffy side bunches with ribbons - NEW puffs + ribbons | blonde, orange, periwinkle
5 high ponytail bun - highbun | slate, brown, pink
6 bob with beaded side locks - "bob" + bead locks | grey, silver, orange
7 small twin top buns with a bob - odango small + "bob" | olive, blonde, rose
8 round bob with clips - "bob" round + clips | orange, olive, red
9 (barber) big spiky twin tails - "twintails" spiky

Nekari (female)
1 bob with bangs - "bob" | orange, brown, red
2 long straight, headband, cheek stripes - "long" + headband + stripes | white, pale pink, mint
3 chin length, long fringe over the eyes - NEW fringe | lilac, orange, cream
4 straight bob with beaded side locks - "bob" + bead locks | blonde, orange, blue
5 swept back, forehead clear, long tail - slickback + "ponytail" | salmon, brown, purple
6 wild spiky mane with headband - NEW wildmane + headband | white, orange, pink
7 short bob with hairband - "bob" short + band | blonde, brown, purple
8 swept back with circlet - slickback + circlet | brown, gold, salmon
9 (barber) medium shag, dark blue - layered

Ursan (male) - manes replace hair; all bearded
1 wide flared side mane - NEW mane_flare | black, brown, navy
2 mane with horn-like tufts - NEW mane_horn | charcoal, white, brown
3 slick mane - NEW mane_slick | white, brown, maroon
4 swept-back mane with pointed tips - mane_slick pointed | charcoal, brown, green
5 round lion mane - NEW mane_lion | rust, black, grey
6 bald crown, side mane - NEW mane_side | rust, black, navy
7 tall spiky crest mane - NEW mane_crest | brown, black, maroon
8 long hair falling down the sides - "long" heavy | black, white, blond
9 (barber) bald with a small top tuft - "bald" + tuft

## New pieces to build
Hair (25): shaggy, tousled, slickback, asymbob, slickbun, sidetail, layered, longshag, feathered, messy, crownbraid, flipbob, highbun, hime, bowl, bowlpeak, tuft, pineapple, poof, odango, puffs, fringe, wildmane, and manes flare, horn, slick, lion, side, crest (counted as one family with shared mane code).
Extras: goatee (beard exists, add short goatee mode), headband, circlet, hair clips, bead locks, ribbons, bun ornament, face paint and forehead tattoo and cheek stripes (painted into the face atlas, so they need new face paints).
Style variants on existing styles: long (centre part, swept back, heavy), bob (bangs, round, short, long), sidepart (long), topknot (small), spiky (short), ponytail (low long), twintails (spiky).

## Data and UI
- rig.js: RACE_FACE_HAIR[race][build][face] = { style, variant, colors: [a, b, c], extras } and per-race face paints (FACE_PAINTS grows for tattoo, paint and stripes).
- Character creation: Face step shows that race's 8 faces; Hair colour step shows that face's 3 colours first, then the shared palette as "More colours".
- Saves: keep a stored hairStyle when it exists (old characters do not change); new characters use the table. Companion and NPC looks are untouched.
- Face 9: unlock through a barber NPC later (optional phase).
- Help, Updates and design notes follow each phase as usual.

## Phases
1. Data and UI (Sonnet): table, colour variants in creation, save handling, use existing styles as stand-ins for the NEW ones.
2. Human and Elari hair (Opus): 12 new styles plus variants and extras; contact sheet for approval.
3. Pipkin, Nekari and Ursan hair (Opus): 13 new styles and the mane family; contact sheet.
4. Extras (Opus): headbands, circlets, clips, beads, ribbons, goatee, face paint, tattoos and stripes.
5. Barber and face 9 (Sonnet, optional).
