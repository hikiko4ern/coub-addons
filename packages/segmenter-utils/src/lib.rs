use icu_segmenter::{WordBreakIteratorUtf16, WordSegmenter};
use itertools::Itertools as _;
use js_sys::{JsString, Set};
use serde::Serialize;
use tsify::Tsify;
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

#[derive(Tsify, Serialize)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct WordsBoundaries {
    words: Vec<Word>,
    #[serde(with = "serde_wasm_bindgen::preserve")]
    #[tsify(type = "Set<number>")]
    word_boundary_indexes: js_sys::Set,
}

#[derive(Tsify, Serialize)]
#[tsify(into_wasm_abi)]
#[serde(rename_all = "camelCase")]
pub struct Word {
    #[serde(with = "serde_wasm_bindgen::preserve")]
    #[tsify(type = "string")]
    word: JsString,
    index: u32,
}

// since `JsValue` is returned, we have to describe functions manually,
// otherwise their return types will be `any`
#[wasm_bindgen(typescript_custom_section)]
const TYPES: &'static str = r#"
export function getFirstWord(input: string): string | undefined;
export function segmentWords(input: string): WordsBoundaries | undefined;
"#;

thread_local! {
    static SEGMENTER: WordSegmenter = WordSegmenter::new_auto();
}

#[wasm_bindgen(js_name = getFirstWord, skip_typescript)]
pub fn get_first_word(input: &JsString) -> JsValue {
    let Some((i, word_type)) = SEGMENTER.with(|segmenter| {
        let code_points = input.iter().collect::<Vec<u16>>();
        let mut it = segmenter.segment_utf16(&code_points);

        let i = it.nth(1)?;
        let word_type = it.word_type();

        Some((i, word_type))
    }) else {
        return JsValue::UNDEFINED;
    };

    if word_type.is_word_like() || is_emoji_utf16(input.iter().take(i)) {
        JsValue::from(input.slice(0, i as u32))
    } else {
        JsValue::UNDEFINED
    }
}

#[wasm_bindgen(js_name = segmentWords, skip_typescript)]
pub fn segment_words(input: &JsString) -> Result<JsValue, serde_wasm_bindgen::Error> {
    let (words, word_boundary_indexes) = SEGMENTER.with(|segmenter| {
        let code_points = input.iter().collect::<Vec<u16>>();

        let mut words: Vec<Word> = Vec::new();
        let word_boundary_indexes = Set::new(&JsValue::UNDEFINED);

        for (i, j, word) in iter_words(input, segmenter.segment_utf16(&code_points)) {
            word_boundary_indexes.add(&JsValue::from_f64(f64::from(i)));
            word_boundary_indexes.add(&JsValue::from_f64(f64::from(j)));
            words.push(Word { word, index: i });
        }

        (words, word_boundary_indexes)
    });

    if words.is_empty() {
        Ok(JsValue::UNDEFINED)
    } else {
        serde_wasm_bindgen::to_value(&WordsBoundaries {
            words,
            word_boundary_indexes,
        })
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
) -> impl Iterator<Item = (u32, u32, JsString)> + use<'l, 's> {
    core::iter::from_fn(move || segmenter.next().map(|i| (i as u32, segmenter.word_type())))
        .tuple_windows()
        .filter(|((i, _), (j, word_type))| {
            word_type.is_word_like()
                || is_emoji_utf16((*i..*j).map(|i| input.char_code_at(i) as u16))
        })
        .map(|((i, _), (j, _))| (i, j, input.slice(i, j)))
}
