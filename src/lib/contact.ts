// Public contact details, in one place.
//
// These were previously duplicated as literals across the footer, contact page,
// structured data and three legal pages, which is how a placeholder phone
// number survived to launch in some of them. Import from here so a change lands
// everywhere at once.

/** Shown to visitors. */
export const contactEmail = "Info@wisemedbilling.com";

/** Formatted for display. */
export const contactPhoneDisplay = "+1 806-230-2995";

/** E.164, for `tel:` links and structured data. */
export const contactPhoneE164 = "+18062302995";

export const contactEmailHref = `mailto:${contactEmail}`;
export const contactPhoneHref = `tel:${contactPhoneE164}`;
