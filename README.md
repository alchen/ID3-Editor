# ID3-Editor

Read and write ID3 tags with just one library.

This library is a thin wrapper around [jsmediatags](https://github.com/aadsm/jsmediatags) and [browser-id3-writer](https://github.com/egoroof/browser-id3-writer), and provide read and write support over some basic id3 fields to allow easier edits.

## Usage

1. `load` the music file and the library will read current tag. This returns a promise.
2. Use `getTag()` or `get('field')` to get current tag fields, and `set` fields to make changes.
3. `save` to commit changes. This returns another promise.

```
const Editor = require('id3-editor');

// first, read a music file
const fileBuffer = fs.readFileSync('music.mp3');

// Then load the file into the editor
const editor = new Editor();
editor.load(fileBuffer).then(() => {
  // get the loaded metadata
  const metadata = editor.getMetadata();

  // make changes
  editor
    .set('title', 'new song')
    .set('track', '2')
    .set('disk', '4/4')
    .set('album', 'different album')
    .set('albumartist', 'another artist')
    .set('year', 1999)
    .set('label', 'Nutrition Facts')
    .set('artists', ['artist 1', 'artist 2', 'artist 3'])
    .set('composers', ['only composer'])
    .set('genre', ['jpop', 'post rock']);

  // save the changes and return a promise
  return editor.save();
}).catch((err) => {
  // handle errors here
});
```