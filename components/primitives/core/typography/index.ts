/**
 * Typography Components
 * 
 * Based on Frosted UI scale (0-9)
 * - Text: For body copy, labels, captions
 * - Heading: For titles, headings
 * 
 * @example
 * import { Text, Heading } from "@/components/primitives/core/typography";
 * 
 * <Heading size={6}>Modal Title</Heading>
 * <Text size={3}>Body copy</Text>
 * <Text size={1} variant="muted">Caption</Text>
 */

export { Text } from "./text";
export { Heading } from "./heading";
export type { TextSize, TextVariant } from "./text";
export type { HeadingSize, HeadingLevel } from "./heading";