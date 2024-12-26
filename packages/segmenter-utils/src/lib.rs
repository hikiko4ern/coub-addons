use icu_segmenter::{WordBreakIteratorUtf16, WordSegmenter};
use itertools::Itertools as _;
use js_sys::{Array, JsString};
use wasm_bindgen::prelude::*;

#[cfg(feature = "console_panic_hook")]
#[wasm_bindgen(start)]
pub fn run() {
    // When the `console_panic_hook` feature is enabled, we can call the
    // `set_panic_hook` function at least once during initialization, and then
    // we will get better error messages if our code ever panics.
    //
    // For more details see
    // https://github.com/rustwasm/console_error_panic_hook#readme
    console_error_panic_hook::set_once();
}

// since `JsValue` is returned, we have to describe functions manually,
// otherwise their return types will be `any`
#[wasm_bindgen(typescript_custom_section)]
const TYPES: &'static str = r#"
export function segmentWords(input: string): string[] | undefined;
"#;

thread_local! {
    static SEGMENTER: WordSegmenter = WordSegmenter::new_auto();
}

#[wasm_bindgen(js_name = segmentWords, skip_typescript)]
pub fn segment_words(input: &JsString) -> JsValue {
    let words = SEGMENTER.with(|segmenter| {
        let code_points = input.iter().collect::<Vec<u16>>();
        let words = Array::new();

        for word in iter_words(input, segmenter.segment_utf16(&code_points)) {
            words.push(&word);
        }

        words
    });

    if words.length() == 0 {
        JsValue::UNDEFINED
    } else {
        words.into()
    }
}

fn is_emoji_utf16<I>(iter: I) -> bool
where
    I: IntoIterator<Item = u16>,
{
    use icu_properties::sets::{self, CodePointSetDataBorrowed};

    const EMOJI: CodePointSetDataBorrowed = sets::emoji();

    char::decode_utf16(iter).all(|c| c.is_ok_and(|c| !c.is_ascii_whitespace() && EMOJI.contains(c)))
}

fn iter_words<'l, 's>(
    input: &'s JsString,
    mut segmenter: WordBreakIteratorUtf16<'l, 's>,
) -> impl Iterator<Item = JsString> + use<'l, 's> {
    core::iter::from_fn(move || segmenter.next().map(|i| (i as u32, segmenter.word_type())))
        .tuple_windows()
        .filter(|((i, _), (j, word_type))| {
            word_type.is_word_like()
                || is_emoji_utf16((*i..*j).map(|i| input.char_code_at(i) as u16))
        })
        .map(|((i, _), (j, _))| input.slice(i, j))
}
