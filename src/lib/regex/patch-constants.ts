/**
 * Universal 3-link+ pattern. Sockets display as e.g. "W-W-W" in item text,
 * with "-" only between LINKED sockets (unlinked groups are space-separated),
 * so `.-.-.` matches any three-or-more linked sockets regardless of colour.
 *
 * From 3.29, gems socket into any colour and sockets default to White, so
 * per-build colour-permutation patterns (e.g. "b-b-g|b-g-b|g-b-b") are
 * obsolete — link COUNT is all that matters for leveling gear.
 */
export const THREE_LINK_PATTERN = '.-.-.';

/**
 * 3.29 (Curse of the Allflame) patch availability: 2026-07-24 10:00 AM PDT
 * (three hours before the 1:00 PM PDT league start, when the patch is
 * already deployed). Before this moment, runs happen on 3.28 where socket
 * colours still matter, so colour-permutation link patterns are used. From
 * this moment, the universal colour-agnostic pattern takes over — both when
 * generating new regex and when combining stored presets for display.
 */
export const POE_329_LAUNCH = new Date('2026-07-24T17:00:00Z');
