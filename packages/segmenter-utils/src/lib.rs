#![allow(non_snake_case)]

use icu_segmenter::{WordSegmenter, WordType};
use itertools::Itertools;
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
pub struct WordsBoundaries {
    words: Vec<Word>,
    #[serde(rename = "wordBoundaryIndexes", with = "serde_wasm_bindgen::preserve")]
    #[tsify(type = "Set<number>")]
    word_boundary_indexes: js_sys::Set,
}

#[derive(Tsify, Serialize)]
#[tsify(into_wasm_abi)]
pub struct Word {
    #[serde(with = "serde_wasm_bindgen::preserve")]
    #[tsify(type = "string")]
    word: JsString,
    index: usize,
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

    if word_type == WordType::Letter {
        JsValue::from(input.slice(0, i as u32))
    } else {
        JsValue::UNDEFINED
    }
}

#[wasm_bindgen(js_name = segmentWords, skip_typescript)]
pub fn segment_words(input: &JsString) -> Result<JsValue, serde_wasm_bindgen::Error> {
    let (words, word_boundary_indexes) = SEGMENTER.with(|segmenter| {
        let word_boundary_indexes = Set::new(&JsValue::UNDEFINED);

        let words: Vec<Word> = {
            let code_points = input.iter().collect::<Vec<u16>>();
            let mut it = segmenter.segment_utf16(&code_points);

            core::iter::from_fn(move || it.next().map(|i| (i, it.word_type())))
                .tuple_windows()
                .filter(|(_, (_, word_type))| *word_type == WordType::Letter)
                .map(|((i, _), (j, _))| {
                    word_boundary_indexes.add(&JsValue::from_f64(i as f64));
                    word_boundary_indexes.add(&JsValue::from_f64(j as f64));
                    Word {
                        word: input.slice(i as u32, j as u32),
                        index: i,
                    }
                })
                .collect()
        };

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
