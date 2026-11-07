# Fix Guides — iNK Fusion Breakdown Help

These are the step-by-step fixes the chat agent uses. **The agent only uses guides marked `status: approved`.** Every guide here starts as `draft`.

## How to review a guide (for Deshitha)

1. Open the guide file (for example `dtf/dtf-head-clog.yaml`).
2. Read the `safety`, `steps`, `escalate_if` and `prevention_tip` fields. Are they correct for **your** machines?
3. Read every item under `owner_check`. These are the points Claude was **not sure** about. Each one needs your answer, for example a temperature or a menu name.
4. Fix anything wrong, delete the `owner_check` items you have answered, and change `status: draft` to `status: approved`.
5. Or tell Claude what to change and it will update the file for you.

> Claude wrote these from general printer knowledge, **not** from your manuals. Please check every value (temperatures, times, menu names) against your machines before approving.

## Guide list

| Folder | Guide | Problem |
|---|---|---|
| dtf | dtf-head-clog | Head clogging / missing nozzles |
| dtf | dtf-white-ink-clog | White ink clogging / weak white |
| dtf | dtf-banding | Lines or banding in prints |
| dtf | dtf-colours-wrong | Colours missing or wrong |
| dtf | dtf-film-feed | Film feed problems |
| dtf | dtf-powder-not-sticking | Powder not sticking |
| dtf | dtf-transfer-peeling | Transfer peeling after pressing |
| dtf | dtf-shaker-dryer | Powder shaker / dryer not heating or not working |
| epson | epson-head-clog | Head clogging / missing nozzles |
| epson | epson-banding | Lines or banding in prints |
| epson | epson-colours-wrong | Colours missing or wrong |
| epson | epson-paper-feed | Paper feed problems |
| epson | epson-error-lights | Error lights and messages |
| sublimation | sublimation-head-clog | Head clogging / missing nozzles |
| sublimation | sublimation-banding | Lines or banding in prints |
| sublimation | sublimation-colours-wrong | Colours missing or wrong |
| sublimation | sublimation-paper-feed | Paper feed problems |
| sublimation | sublimation-error-codes | Error lights and codes |
| software | software-rip-wont-open | RIP / print software won't open |
| software | software-dongle-not-detected | Licence / dongle not detected |
| software | software-printer-not-found | RIP software can't find the printer |
| software | pc-printer-not-detected | Printer not detected by the PC (USB / network) |
| heatpress | heatpress-not-heating | Not heating, or heating slowly |
| heatpress | heatpress-temp-mismatch | Temperature not matching the setting |
| heatpress | heatpress-uneven-pressure | Uneven pressure or uneven transfer |
| heatpress | heatpress-timer-alarm | Timer or alarm not working |
| heatpress | heatpress-transfer-not-sticking | Transfer not sticking or fading |

## File format

```yaml
id: dtf-head-clog                  # unique name, same as the file name
machine: dtf                       # dtf | epson | sublimation | heatpress, or a list of them
problem: Head clogging / missing nozzles
ask_first:                         # optional: questions the agent asks before step 1
  - "Which RIP software do you use?"
safety: "Keep the printer ON for cleaning. Wear gloves."
steps:                             # the agent sends ONE step per message
  - text: "Print a nozzle check."
    media: nozzle-check.mp4        # optional: photo or video (file name or YouTube link)
max_attempts_before_escalation: 3  # how many times the customer may repeat the steps before the agent escalates
escalate_if:                       # escalate straight away if any of these happen
  - "Ink leaking"
prevention_tip: "Print a nozzle check every morning."
status: draft                      # draft | approved — only approved guides are used
owner_check:                       # Claude's questions for the owner. Remove once answered.
  - "Confirm the cleaning menu name on your DTF model."
```

### Rules every guide follows (from PRD section 9)
- Never open electrical panels or touch mainboards, power supplies or wiring.
- Never soak the head, force parts, or do anything that could void the warranty.
- Always warn about heat (heat press, dryer) and chemicals (ink, cleaning solution).
- No prices, quotes, warranty promises or supplier contact details.

### Languages
Guides are written in simple English. The agent translates each step into Sinhala, Singlish or Tamil when it talks to the customer.

### Adding photos and videos
Put an unlisted YouTube link or a file name in `media:` on any step. Media files will be uploaded through the admin page (Phase 3).
