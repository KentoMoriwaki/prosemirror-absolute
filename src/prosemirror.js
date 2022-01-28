import { EditorView } from "prosemirror-view";
import { EditorState } from "prosemirror-state";
import { Schema, DOMParser } from "prosemirror-model";
import { schema as baseSchema } from "prosemirror-schema-basic";
import { exampleSetup } from "prosemirror-example-setup";
import { keymap } from "prosemirror-keymap";
import * as Y from "yjs";
import { ySyncPlugin, yUndoPlugin, undo, redo } from "y-prosemirror";
import applyDevTools from "prosemirror-dev-tools";

import "prosemirror-menu/style/menu.css";

const useYjs = false;

const ydoc = new Y.Doc();
const type = ydoc.get("prosemirror", Y.XmlFragment);

const nodes = baseSchema.spec.nodes;
let marks = baseSchema.spec.marks;
marks = marks.append({
  w: {
    attrs: {
      wordId: { default: null }
    },
    inclusive: true,
    parseDOM: [
      {
        tag: "span",
        getAttrs: (node) => {
          const wordId = parseInt(node.getAttribute("wordId"), 10);
          if (wordId) {
            return {
              wordId
            };
          }
          return false;
        }
      }
    ],
    toDOM(node) {
      return [
        "span",
        {
          ...node.attrs,
          class: `word`
        },
        0
      ];
    }
  }
});

const schema = new Schema({ nodes, marks });

/**
 * @type EditorView
 */
let view;

function setupProsemirror() {
  const node = document.getElementById("app");

  const plugins = [
    useYjs && ySyncPlugin(type),
    // yCursorPlugin(provider.awareness),
    useYjs && yUndoPlugin(),
    useYjs &&
      keymap({
        "Mod-z": undo,
        "Mod-y": redo,
        "Mod-Shift-z": redo
      })
  ].filter((p) => Boolean(p));

  plugins.push(
    ...exampleSetup({
      schema,
      mapKeys: {
        "Mod-b": !useYjs,
        "Mod-z": !useYjs,
        "Mod-y": !useYjs,
        "Mod-Shift-z": !useYjs
      }
    })
  );

  const doc = DOMParser.fromSchema(schema).parse(
    document.querySelector("#content")
  );

  const state = EditorState.create({
    doc,
    schema,
    plugins
  });

  view = new EditorView(node, {
    state
  });

  applyDevTools(view);
}

setupProsemirror();

type.observeDeep(([event]) => {
  // console.log(event);
  const xml = type.firstChild;
  const text = xml.firstChild;
  console.log(text.toDelta());
});
