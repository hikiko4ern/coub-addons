# coub-addons

[English](./README.md) · [Русский](./README.ru.md)

<!-- short-description start -->

Web Extension, which adds additional functionality to [Coub.com](https://coub.com)

<!-- short-description end -->

Minimum supported browser versions:

- Firefox 101

> [!WARNING]
> The extension is in the early stages of development, so it is temporary:
>
> - works only on Firefox-based browsers and may not work in other browsers\
>   for example, request filtering is now built on [`webRequest.filterResponseData`](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/webRequest/filterResponseData) and will not work in Chromium-based browsers and Safari, which do not implement this API
> - is not published in stores and can only be installed from releases (auto-updates are supported)
> - occasionally there may be backwards incompatible changes that require **manual** migration of settings (_although this has never happened before, and I hope it never will, but do backups, backups are great_)
>
> If everything you've read doesn't discourage you from trying it, download the [latest release][latest-release].

## Features

<!-- features start -->

- hiding disliked coubs
- hiding coubs, stories and comments from blocked channels
- hiding coubs by title and tags containing specified phrases or matching regular expressions
- hiding recoubs and reposted stories
- quick tag copy/block via context menu
- displaying the date of coub publication in “Popular” and communities
- integration with [Media Session API](https://developer.mozilla.org/en-US/docs/Web/API/Media_Session_API):
  - providing information about the currently playing coub
  - pause and resume playback
- preventing playback speed change when <kbd>W</kbd>/<kbd>S</kbd> is pressed
- additional hotkeys:
  <!-- spell-checker: ignore islike ookmark ullscreen -->
  <!-- shortcuts-table -->
  | action                    | default hotkey                       |
  | :------------------------ | :----------------------------------- |
  | put/remove dislike        | <kbd>D</kbd> (<ins>D</ins>islike)    |
  | add/remove from bookmarks | <kbd>B</kbd> (<ins>B</ins>ookmark)   |
  | toggle fullscreen mode    | <kbd>F</kbd> (<ins>F</ins>ullscreen) |
  | copy link to coub         | —                                    |

<!-- features end -->

<!-- reload-warn start -->

After installing the extension (and sometimes updating it) you need to refresh [Coub.com](https://coub.com) pages - some of the functionality works by injecting into Coub's code and requires patches to be applied when the page loads.

<!-- reload-warn end -->

<!-- dprint-ignore -->
> [!TIP]
> Filtering of coubs (disliked, from blocked channels, etc.) is applied to the API responses, so:
> - changing filters does not affect already loaded coubs
>
>   so, if you open the `Anime` community and dislike the first coub, it will not be hidden immediately, but only when you re-request that page of the list (for example, after refreshing the page or after going to another page and returning to the community)
>
> - in some situations may generate states that the logic of [Coub.com](https://coub.com) itself does not take into account (example - hikiko4ern/coub-addons#5)

<!-- links -->

[latest-release]: https://github.com/hikiko4ern/coub-addons/releases/latest
