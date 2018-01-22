'use strict';
const stream = require('stream');
const reader = require('music-metadata');
const Writer = require('browser-id3-writer');
const Remover = require('remove-id3v1');

const frameMap = [
  {frame: 'TPE1', name: 'artists'},
  {frame: 'TCOM', name: 'composers'},
  {frame: 'TCON', name: 'genre'},
  {frame: 'TIT2', name: 'title'},
  {frame: 'TALB', name: 'album'},
  {frame: 'TPE2', name: 'albumartist'},
  {frame: 'TPE3', name: 'TPE3'},
  {frame: 'TPE4', name: 'TPE4'},
  {frame: 'TRCK', name: 'track'},
  {frame: 'TPOS', name: 'disk'},
  {frame: 'TMED', name: 'TMED'},
  {frame: 'TPUB', name: 'label'},
  {frame: 'TBPM', name: 'TBPM'},
  {frame: 'TLEN', name: 'TLEN'},
  {frame: 'TYER', name: 'year'},
  {frame: 'USLT', name: 'lyrics'},
  {frame: 'APIC', name: 'picture'},
  {frame: 'TXXX', name: 'TXXX'},
  {frame: 'TKEY', name: 'TKEY'},
  {frame: 'WCOM', name: 'WCOM'},
  {frame: 'WCOP', name: 'WCOP'},
  {frame: 'WOAF', name: 'WOAF'},
  {frame: 'WOAR', name: 'WOAR'},
  {frame: 'WOAS', name: 'WOAS'},
  {frame: 'WORS', name: 'WORS'},
  {frame: 'WPAY', name: 'WPAY'},
  {frame: 'WPUB', name: 'WPUB'},
  {frame: 'COMM', name: 'comment'}
];

class Editor {
  load(buffer) {
    return new Promise((resolve, reject) => {
      this.buffer = buffer;
      this.writer = new Writer(this.buffer);
      this.tag = {};
  
      let bufferStream = new stream.PassThrough();
      bufferStream.end(this.buffer);
      reader.parseStream(bufferStream, 'audio/mpeg').then((rawTag) => {
        this.saveRawTag(rawTag)
        resolve();
      }).catch(reject);
    });
  }

  saveRawTag(rawTag) {
    this.tag = {};

    Object.keys(rawTag.common).forEach((key) => {
      switch (key) {
        case 'title':
        case 'album':
        case 'albumartist':
        case 'year':
        case 'label':
        case 'composer':
        case 'artists':
        case 'genre':
          this.tag[key] = rawTag.common[key];
          break;
        case 'track':
        case 'disk':
          if (rawTag.common[key].no && rawTag.common[key].of) {
            this.tag[key] = rawTag.common[key].no + '/' + rawTag.common[key].of
          } else if (rawTag.common[key].no) {
            this.tag[key] = rawTag.common[key].no
          }
          break;
        case 'picture':
          let firstPicture = rawTag.common[key] && rawTag.common[key][0];
          if (firstPicture) {
            this.tag[key] = {
              type: 3,
              data: firstPicture.data,
              description: ''
            };
          }
          break;
        default:
          break;
      }
    });
  }

  getTag() {
    return this.tag;
  }

  applyTag(tag) {
    frameMap.filter(pair => !!tag[pair.name]).forEach((pair) => {
      this.writer.setFrame(pair.frame, tag[pair.name]);
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
    return new Promise((resolve, reject) => {
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
