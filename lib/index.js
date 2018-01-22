'use strict';
const steam = require('stream');
const reader = require('musicmetadata');
const Writer = require('browser-id3-writer');
const Remover = require('remove-id3v1');

const frameMap = [
  {frame: 'TPE1', name: 'artist'},
  {frame: 'TCOM', name: 'composer'},
  {frame: 'TCON', name: 'genre'},
  {frame: 'TIT2', name: 'title'},
  {frame: 'TALB', name: 'album'},
  {frame: 'TPE2', name: 'albumartist'},
  {frame: 'TPE3', name: 'TPE3'},
  {frame: 'TPE4', name: 'TPE4'},
  {frame: 'TRCK', name: 'track'},
  {frame: 'TPOS', name: 'disk'},
  {frame: 'TMED', name: 'TMED'},
  {frame: 'TPUB', name: 'TPUB'},
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
  static getArrayBuffer(input) {
    if (input instanceof Buffer) {
      return input.buffer;
    } else if (input instanceof ArrayBuffer) {
      return input;
    }

    throw new Error('First argument should be an instance of ArrayBuffer or Buffer');
  }

  load(input) {
    this.buffer = getArrayBuffer(input);
    this.writer = new Writer(this.buffer);
    this.metadata = {};

    return new Promise(function (resolve, reject) {
      var bufferStream = new stream.PassThrough();
      bufferStream.end(this.buffer);
      reader(bufferStream, function (err, metadata) {
        if (err) {
          reject(err);
        }
        resolve(metadata);
      });
    });
  }

  metadata() {
    return this.metadata;
  }

  applyMetadata(metadata) {
    frameMap.filter(function (pair) {
      return !!metadata[pair.name];
    }).forEach(function (pair) {
      this.writer.setFrame(pair.frame, metadata[pair.name]);
    });
    this.writer.addTag();
  }

  removeID3v1() {
    const hasTag = Remover.hasTag(this.buffer);
    if (hasTag) {
      this.buffer = Remover.removeTag(this.buffer);
      this.writer = new Writer(this.buffer);
    }
  }

  save() {
    return new Promise(function (resolve, reject) {
      this.applyMetadata(this.metadata);
      this.removeID3v1();
      resolve();
    });
  }

  set(field, value) {
    this.metadata[field] = value;
    return this;
  }
}

module.exports = Editor;
