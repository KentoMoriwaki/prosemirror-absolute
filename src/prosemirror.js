import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as baseSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import * as Y from "yjs";
import { ySyncPlugin, yUndoPlugin, undo, redo } from "y-prosemirror";
import data from "./presyncv2.data";
// import applyDevTools from "prosemirror-dev-tools";

// import "prosemirror-menu/style/menu.css";

const useYjs = true;

const ydoc = new Y.Doc();
const type = ydoc.get("prosemirror", Y.XmlFragment);

let nodes = baseSchema.spec.nodes;
nodes = nodes.append({
  transcript: {
    attrs: {
      transcriptId: {
        default: null,
      },
      speakerId: {
        default: null,
      },
      startTime: {
        default: null,
      },
      endTime: {
        default: null,
      },
      diarizedByHand: {
        default: null,
      },
    },
    content: "inline*",
    group: "block",
    parseDOM: [
      {
        tag: "p",
      },
    ],
    toDOM(node) {
      return ["p", node.attrs, 0];
    },
  },
});
let marks = baseSchema.spec.marks;
marks = marks.append({
  w: {
    attrs: {
      wordId: { default: null },
    },
    inclusive: true,
    parseDOM: [
      {
        tag: "span",
        getAttrs: (node) => {
          const wordId = parseInt(node.getAttribute("wordId"), 10);
          if (wordId) {
            return {
              wordId,
            };
          }
          return false;
        },
      },
    ],
    toDOM(node) {
      return [
        "span",
        {
          ...node.attrs,
          class: `word`,
        },
        0,
      ];
    },
  },
});

const schema = new Schema({ nodes, marks });

function loadData() {
  return fetch(data)
    .then((a) => {
      return a.arrayBuffer();
    })
    .then((buf) => {
      Y.applyUpdateV2(ydoc, new Uint8Array(buf));
    });
}

/**
 * @type EditorView
 */
let view;

function setupProsemirror() {
  const root = document.getElementById("app");

  const plugins = [
    useYjs && ySyncPlugin(type),
    // yCursorPlugin(provider.awareness),
    useYjs && yUndoPlugin(),
    useYjs &&
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo,
      }),
  ].filter((p) => Boolean(p));

  plugins.push(
    ...exampleSetup({
      schema,
      menuBar: false,
      mapKeys: useYjs
        ? {
            "Mod-b": false,
            "Mod-z": false,
            "Mod-y": false,
            "Mod-Shift-z": false,
          }
        : undefined,
    })
  );

  const doc = DOMParser.fromSchema(schema).parse(
    document.querySelector("#content")
  );

  const state = EditorState.create({
    doc,
    schema,
    plugins,
  });

  view = new EditorView(root, {
    state,
  });

  // applyDevTools(view);
}

loadData()
  .then(() => {
    setupProsemirror();
  })
  .catch((e) => {
    console.error(e);
  });
