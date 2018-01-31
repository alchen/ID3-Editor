'use strict';

const reader = require('jsmediatags');
const Writer = require('browser-id3-writer');
const Remover = require('remove-id3v1');

const imageTypes = [
  'Other',
  '32x32 pixels \'file icon\' (PNG only)',
  'Other file icon',
  'Cover (front)',
  'Cover (back)',
  'Leaflet page',
  'Media (e.g. label side of CD)',
  'Lead artist/lead performer/soloist',
  'Artist/performer',
  'Conductor',
  'Band/Orchestra',
  'Composer',
  'Lyricist/text writer',
  'Recording Location',
  'During recording',
  'During performance',
  'Movie/video screen capture',
  'A bright coloured fish',
  'Illustration',
  'Band/artist logotype',
  'Publisher/Studio logotype',
];

const editableMap = [
  { frame: 'TPE1', name: 'artists', transform: s => s.split('/') },
  { frame: 'TCOM', name: 'composers', transform: s => s.split('/') },
  { frame: 'TCON', name: 'genre', transform: s => [s] },
  { frame: 'TIT2', name: 'title' },
  { frame: 'TALB', name: 'album' },
  { frame: 'TPE2', name: 'albumartist' },
  { frame: 'TYER', name: 'year', transform: parseInt },
  {
    frame: 'USLT',
    name: 'lyrics',
    transform: o => ({
      description: o.descriptor,
      lyrics: o.lyrics,
    }),
  },
  {
    frame: 'APIC',
    name: 'picture',
    transform: o => ({
      description: o.description,
      data: Buffer.from(o.data),
      type: imageTypes.indexOf(o.type),
    }),
  },
  { frame: 'TRCK', name: 'track' },
  { frame: 'TPUB', name: 'label' },
  { frame: 'TPOS', name: 'disk' },
  { frame: 'COMM', name: 'comment' },
];

const readonlyMap = [
  { frame: 'TPE3', name: 'TPE3' },
  { frame: 'TPE4', name: 'TPE4' },
  { frame: 'TMED', name: 'TMED' },
  { frame: 'TBPM', name: 'TBPM' },
  { frame: 'TLEN', name: 'TLEN' },
  { frame: 'TXXX', name: 'TXXX' },
  { frame: 'TKEY', name: 'TKEY' },
  { frame: 'WCOM', name: 'WCOM' },
  { frame: 'WCOP', name: 'WCOP' },
  { frame: 'WOAF', name: 'WOAF' },
  { frame: 'WOAR', name: 'WOAR' },
  { frame: 'WOAS', name: 'WOAS' },
  { frame: 'WORS', name: 'WORS' },
  { frame: 'WPAY', name: 'WPAY' },
  { frame: 'WPUB', name: 'WPUB' },
];

class Editor {
  load(buffer) {
    return new Promise((resolve, reject) => {
      this.buffer = buffer;
      this.writer = new Writer(this.buffer);
      this.tag = {
        readonly: {},
      };

      reader.read(this.buffer, {
        onSuccess: (rawTag) => {
          this.saveRawTag(rawTag);
          resolve(this);
        },
        onError: reject,
      });
    });
  }

  saveRawTag(rawTag) {
    this.tag = {
      readonly: {},
    };

    editableMap.filter(pair => !!rawTag.tags[pair.frame]).forEach((pair) => {
      if (pair.transform) {
        this.tag[pair.name] = pair.transform(rawTag.tags[pair.frame].data);
      } else {
        this.tag[pair.name] = rawTag.tags[pair.frame].data;
      }
    });

    readonlyMap.filter(pair => !!rawTag.tags[pair.frame]).forEach((pair) => {
      this.tag.readonly[pair.name] = rawTag.tags[pair.frame].data;
    });
  }

  getTag() {
    return this.tag;
  }

  applyTag(tag) {
    editableMap.filter(pair => !!tag[pair.name]).forEach((pair) => {
      this.writer.setFrame(pair.frame, tag[pair.name]);
    });

    readonlyMap.filter(pair => !!tag.readonly[pair.name]).forEach((pair) => {
      this.writer.setFrame(pair.frame, tag.readonly[pair.name]);
    });

    this.writer.addTag();
    this.buffer = Buffer.from(this.writer.arrayBuffer);
  }

  removeID3v1() {
    const hasTag = Remover.hasTag(this.buffer);
    if (hasTag) {
      this.buffer = Remover.removeTag(this.buffer);
      this.writer = new Writer(this.buffer);
    }
  }

  save() {
    return new Promise((resolve) => {
      this.applyTag(this.tag);
      this.removeID3v1();
      resolve();
    });
  }

  get(field) {
    return this.tag[field];
  }

  set(field, value) {
    this.tag[field] = value;
    return this;
  }
}

module.exports = Editor;
