const Editor = require('../lib');
const fs = require('fs');
const path = require('path');

const assetFolder = path.join(__dirname, 'assets');

describe('ID3 Editor', () => {
  it('should be able to read ID3 tags', () => {
    const editor = new Editor();
    const songBuffer = fs.readFileSync(path.join(assetFolder, 'sample.mp3'));
    const coverPicture = fs.readFileSync(path.join(assetFolder, 'sample.jpg'));

    editor.load(songBuffer).then(() => {
      const got = editor.getMetadata();
      const expected = {
        title: 'song title',
        track: '5/10',
        disk: '1/3',
        album: 'album title',
        albumartist: 'album artist',
        year: 2000,
        label: 'label name',
        artists: ['artist 1', 'artist 2'],
        composer: ['composer 1', 'composer 2'],
        genre: ['genre 1;genre 2'],
        picture: {
          type: 3,
          description: '',
          data: coverPicture
        }
      };

      expect(got).toEqual(expected);
    }).catch((err) => {
      fail(err);
    });
  });

  it('should be able to edit ID3 tags', () => {
    const editor = new Editor();
    const songBuffer = fs.readFileSync(path.join(assetFolder, 'sample.mp3'));
    const coverPicture = fs.readFileSync(path.join(assetFolder, 'sample.jpg'));

    editor.load(songBuffer).then(() => {
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
      return editor.save();
    }).then(() => {
      const secondEditor = new Editor();
      secondEditor.load(editor.buffer).then(() => {
        const got = secondEditor.getMetadata();
        const expected = {
          title: 'new song',
          track: 2,
          disk: '4/4',
          album: 'different album',
          albumartist: 'another artist',
          year: 1999,
          label: 'Nutrition Facts',
          artists: ['artist 1', 'artist 2', 'artist 3'],
          composer: ['only composer'],
          genre: ['jpop;post rock'],
          picture: {
            type: 3,
            description: '',
            data: coverPicture
          }
        };
  
        expect(got).toEqual(expected);
      }).catch((err) => {
        fail(err);
      });
    }).catch((err) => {
      fail(err);
    });
  });
});
