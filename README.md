# La Bonne Bouffe

Learn French food vocabulary with flashcards, multiple-choice quizzes, and typing practice. Play **Order Up!**, a restaurant game that puts the food vocabulary to work. Explore **130 terms across 11 topics**, with an English interface and questions in both French and English.

**[Start studying →](https://sealsarecute2.github.io/labonnebouffe/)**

## Three ways to practise

| Study mode | What to do |
| --- | --- |
| **Flashcards** | Read the word and try to recall its translation. Reveal the answer, then choose **Got it** or **Still learning**. |
| **Multiple choice** | Pick the matching translation from four choices. Check the feedback before continuing. |
| **Type the answer** | Type the translation yourself. Check your answer, or use a hint when you need one. |

There’s no time limit. Work at your own pace.

## Order Up! — open your own café

Choose the **Order Up!** tab beside the study modes. Read each order ticket, select its ingredients, then **Serve order**. Every fourth ticket is a restock request: type the translation to label the delivery.

- **2-minute rush:** serve as many orders as you can before the shift ends. Table patience runs down while you work.
- **No pressure:** play without a clock or patience limit, and finish whenever you like.
- Choose French orders with English ingredients, or switch to English orders with French ingredients. Restocking practises the other direction.
- Clean orders build a streak and a points multiplier. Faster clean orders earn **$1–$5 in tips per order**; an order completed with help earns $1. Pauses and feedback do not count toward your service time. Earn tips to unlock café decorations, and beat your personal best for each menu and translation direction.
- Missed words return in later tickets and join your normal study review. Using a translation or correcting an answer keeps that word in review.
- **Pause** whenever you need. The game also pauses when you switch tabs or leave the window. The clock stops while you read corrections and feedback.

Earn **lifetime tips** to unlock ten café rewards, from a potted plant at $25 to the signature flower arrangement at $5,000. Plants, pendant and fairy lights, flowers, linen, candlelight, and silver or gold utensils appear around your plate during service. Open **Café rewards** under your café to see the next milestone. Spending tips does not remove decorations.

Use **1–9** to select ingredients, **Enter** to serve, and **Esc** to pause. On a phone, use the on-screen controls. French articles and accents follow the same rules as typing practice.

The café menu uses the food and drink terms from the deck. Continue using the study modes for the full 130-word vocabulary, including descriptions and table expressions.

## Choose your practice

Use the controls above the study card to choose:

- **Topic:** practise all vocabulary or focus on one category.
- **Translation direction:** French → English, English → French, or **Both ways**.
- **Round length:** 10 words, 20 words, or all words in your selection.

At the end of a round, see how you did and review the words that need another look.

## Tips for typing answers

- **French articles are optional.** For example, both `pomme` and `la pomme` are accepted for apple.
- **Accents are optional by default.** Turn on **Require exact accents** when you want to practise them too.
- **Use the accent buttons** below the answer box to enter French characters.
- **Listed alternatives are accepted**, including supported masculine/feminine forms, singular/plural forms, and common translations.
- **Need a hint?** Reveal the first letter. A word answered with a hint stays in your review collection.
- **Skip for now** reveals the answer and keeps the word for review.

## Build your own collection

Use the **bookmark** on a card or in the vocabulary list to save a word. Select **Saved words** from the topic menu to practise your collection.

Open **Vocabulary** to search in French or English, browse translations, and read notes about individual terms.

## See what you’re learning

A word is marked **learned** after two correct recalls in a row. You can build that streak across any of the three study modes. In flashcards, your **Got it** or **Still learning** choice records your recall.

A missed answer, skipped word, or hint brings the word back for review. Choose **Words to review** or the review link beside the study area to practise those words again.

Select the **words learned** counter to see your overall progress and progress by topic.

## Vocabulary topics

- Fruit
- Vegetables
- Dairy
- Protein
- Grains
- Desserts
- Drinks
- Fast food & snacks
- Pantry & spices
- Describing food
- At the table

The vocabulary comes from the *La Bonne Bouffe* classroom slides. Open **About this vocabulary** for explanations of corrected typos, completed translations, and terms that vary by region.

## Make it comfortable

The website adapts to phones, tablets, and computers, and starts with your device’s light or dark appearance. Use the sun or moon button in the header to switch modes; your choice is saved. To follow your device again, choose **Settings → Appearance → Use device setting**. You can use the on-screen controls or keyboard shortcuts:

| Action | Key |
| --- | --- |
| Turn a flashcard | **Space** |
| Mark Still learning after revealing a flashcard | **1** |
| Mark Got it after revealing a flashcard | **2** |
| Choose a multiple-choice answer | **1–4** |
| Check a typed answer or continue after feedback | **Enter** |
| Close a dialog | **Esc** |

## Your progress stays with you

No account is needed. Your progress, saved words, settings, and current round are saved in the browser on your device, so you can return and continue.

Progress does not sync between browsers or devices. Clearing browser data or using private browsing may remove it. If browser storage is unavailable, you can still study during the current visit.

To start fresh, open **Settings → Reset study data**. This also resets your café, tips, and game records.

## Plate-shop audio

The secret shop uses Valve’s original CS2 case unlock, crate-scroll click, and rarity reveal samples, encoded at 160 kbps MP3. The source is [Source2Sounds/cs2](https://github.com/Source2Sounds/cs2/tree/3eb039f9b98564104b7cc2d5ee50888f38752caf/sounds/ui), pinned in `assets/audio/manifest.json`. The game’s [Panorama case flow](https://github.com/SteamTracking/GameTracking-CS2/blob/master/game/csgo/pak01_dir/panorama/scripts/popups/popup_capability_decodable.js) supplies the two-second intro and six-second reel timing. Clicks follow the cards crossing the pointer; the reveal sound starts when the reel stops.

Run `python3 scripts/build.py` after changing the source or sound assets. The build embeds the samples in `index.html`, so the published page also plays offline without external audio requests.
