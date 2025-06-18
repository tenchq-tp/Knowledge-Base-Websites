"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";
import { Node, mergeAttributes, Mark } from "@tiptap/core";
import { Plugin, PluginKey } from "prosemirror-state";
import { useEditor, EditorContent } from "@tiptap/react";
import Swal from "sweetalert2";
import {
  faFileImport,
  faBold,
  faItalic,
  faUnderline,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
  faStrikethrough,
  faChevronDown,
  faChevronUp,
  faSubscript,
  faEraser,
  faLink,
  faSave,
  faFileExport,
  faRedo,
  faUndo,
  faFont,
  faFillDrip,
  faTable,
  faPlus, // Import the plus icon
  faTimes, // Import the times icon for removing tags
  faSearch,
  faMinus,
  faSmile,
  faCheckSquare,
  faHeading,
  faCaretDown,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// 💡 ฟีเจอร์เสริม
import Gapcursor from "@tiptap/extension-gapcursor";
import Dropcursor from "@tiptap/extension-dropcursor";
import CharacterCount from "@tiptap/extension-character-count";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import FloatingMenu from "@tiptap/extension-floating-menu";
import HardBreak from "@tiptap/extension-hard-break";
import HorizontalRule from "@tiptap/extension-horizontal-rule";

// ✅ เช็กลิสต์
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

// 🔎 Mention
import Mention from "@tiptap/extension-mention";

// ✨ Typography
import Typography from "@tiptap/extension-typography";

// 👥 Collaboration
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";

import ImageResize from "tiptap-extension-resize-image";
import "@tiptap/extension-text-style";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";

import { useState, useCallback, useEffect, useRef } from "react";
import Navbar from "../../../component/Navbar";

import styles from "../../../style/create_article.module.css";
import "../../../../lib/i18n";

const html2pdf = dynamic(() => import("html2pdf.js"), { ssr: false });

// --- Hashtag Extension Code ---
const HASHTAG_REGEX = /(#[\w\u0E00-\u0E7F]+)/g; // Added Thai character support
const ArticleImage = Image.extend({
  name: "articleImage", // ชื่อเฉพาะของ Node นี้ (ใช้ใน toJSON และ addCommands)

  addAttributes() {
    return {
      ...this.parent?.(), // สืบทอด Attributes มาตรฐานจาก Image (เช่น src, alt, title)
      // เพิ่ม 'filename' attribute เพื่อเก็บชื่อไฟล์ที่ไม่ซ้ำกัน
      filename: {
        default: null, // ค่าเริ่มต้น
        parseHTML: (element) => element.getAttribute("data-filename") || null, // วิธีดึงค่าจาก HTML
        renderHTML: (attributes) => {
          // วิธีเรนเดอร์ลง HTML
          if (attributes.filename) {
            return { "data-filename": attributes.filename };
          }
          return {};
        },
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    // วิธีการเรนเดอร์รูปภาพใน Editor (ใช้ src สำหรับแสดงผล)
    return ["img", HTMLAttributes];
  },

  parseHTML() {
    // วิธีการแปลง HTML กลับมาเป็นสถานะของ Editor
    return [
      {
        tag: "img[src]",
        getAttrs: (element) => {
          const src = element.getAttribute("src");
          const filename = element.getAttribute("data-filename");
          // Fallback: ถ้าไม่มี data-filename แต่ src เป็น {placeholder} ก็ดึง filename ออกมา
          if (!filename && src && src.startsWith("{") && src.endsWith("}")) {
            return { src: src, filename: src.substring(1, src.length - 1) }; // ต้องคืนค่า src ด้วย
          }
          return {
            src,
            alt: element.getAttribute("alt"),
            title: element.getAttribute("title"),
            filename: filename,
          };
        },
      },
    ];
  },
  toJSON() {
    console.error(
      "🚨🚨🚨 DEBUG: ArticleImage.toJSON() IS BEING CALLED! 🚨🚨🚨"
    );

    const { filename, src } = this.attrs;

    console.log("DEBUG: Attributes received by toJSON():", { filename, src });

    if (filename) {
      const finalSrc = `{${filename}}`;
      console.error(
        "✅ DEBUG: ArticleImage.toJSON() Returning filename format:",
        finalSrc
      );
      return {
        type: this.name,
        attrs: {
          src: finalSrc,
        },
      };
    }
    // Fallback: ถ้าไม่มี filename แต่มี src (กรณีที่ Tiptap อาจจะสร้าง Node มาโดยไม่มี filename หรือรูปภาพมาจากแหล่งอื่น)
    else if (src) {
      console.error(
        "⚠️ DEBUG: ArticleImage.toJSON() Returning original src (filename not found!):",
        src
      );
      return {
        type: this.name,
        attrs: {
          src: src, // <<-- ถ้า filename ไม่มีค่า คุณจะเห็น Base64 ถูกส่งออกมาตรงนี้
        },
      };
    }
    console.error(
      "❌ DEBUG: ArticleImage.toJSON() Returning empty object (no src or filename)."
    );
    return {};
  },

  // 🌟🌟🌟 สำคัญ: การสร้าง Command สำหรับแทรกรูปภาพ 🌟🌟🌟
  addCommands() {
    return {
      insertArticleImage:
        ({ src, filename }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name, // อ้างถึง 'articleImage' ที่นิยามไว้
            attrs: { src, filename }, // ส่ง Base64 (สำหรับแสดงผล) และ filename (สำหรับ JSON)
          });
        },
    };
  },
});

export const Hashtag = Mark.create({
  name: "hashtag",

  addAttributes() {
    return {
      value: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span",
        getAttrs: (element) => element.hasAttribute("data-hashtag") && null,
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Render as a span with inline style for blue color and data attribute
    return [
      "span",
      { ...HTMLAttributes, style: "color: blue;", "data-hashtag": "true" },
      0,
    ];
  },

  addCommands() {
    return {
      setHashtag:
        (value) =>
        ({ commands }) => {
          return commands.setMark(this.name, { value });
        },
      unsetHashtag:
        () =>
        ({ commands }) => {
          return commands.unsetMark(this.name);
        },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("hashtagSuggestion"),
        appendTransaction: (transactions, oldState, newState) => {
          const { doc } = newState;
          const tr = newState.tr;
          let changed = false;

          if (!transactions.some((tr) => tr.docChanged)) {
            return;
          }

          doc.descendants((node, pos) => {
            if (node.isText) {
              const text = node.text;
              if (!text) return;

              let match;
              // Reset regex lastIndex to 0 for each text node
              HASHTAG_REGEX.lastIndex = 0;
              while ((match = HASHTAG_REGEX.exec(text))) {
                const hashtagText = match[0];
                const start = pos + match.index;
                const end = start + hashtagText.length;

                const currentMarks = doc.resolve(start).marks();
                const isMarked = currentMarks.some(
                  (mark) =>
                    mark.type.name === this.name &&
                    mark.attrs.value === hashtagText
                );

                if (!isMarked) {
                  tr.addMark(
                    start,
                    end,
                    this.type.create({ value: hashtagText })
                  );
                  changed = true;
                }
              }

              // Remove marks that are no longer valid hashtags
              node.marks.forEach((mark) => {
                if (mark.type.name === this.name) {
                  const markStart = pos;
                  const markEnd = pos + node.nodeSize;
                  const originalText = node.text.substring(
                    markStart - pos,
                    markEnd - pos
                  );
                  if (
                    !HASHTAG_REGEX.test(originalText) ||
                    mark.attrs.value !== originalText
                  ) {
                    tr.removeMark(markStart, markEnd, mark);
                    changed = true;
                  }
                }
              });
            }
          });

          if (changed) {
            return tr;
          }
        },
      }),
    ];
  },
});

// --- CustomFontSize Extension Code ---
export const CustomFontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => {
          const fontSize = element.style.fontSize;
          console.log("Parsing font size from HTML:", element, "->", fontSize);
          return fontSize || null;
        },
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            console.log("renderHTML: No font size attribute, returning empty.");
            return {};
          }
          const size = String(attributes.fontSize).endsWith("px")
            ? attributes.fontSize
            : `${attributes.fontSize}px`;
          console.log(
            "renderHTML: Applying font-size:",
            size,
            "from attributes:",
            attributes
          );
          return { style: `font-size: ${size}` };
        },
      },
    };
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ chain }) => {
          console.log("setFontSize command called with:", fontSize);
          const size = String(fontSize).endsWith("px")
            ? fontSize
            : `${fontSize}px`;
          return chain().setMark("textStyle", { fontSize: size }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          console.log("unsetFontSize command called");
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    };
  },
});

const FONT_SIZES = [
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
  "36px",
  "48px",
  "72px",
];
const emojiList = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "😊",
  "😇",
  "🙂",
  "🙃",
  "😉",
  "😌",
  "😍",
  "🥰",
  "😘",
  "😗",
  "😋",
  "😛",
  "😝",
  "😜",
  "🤪",
  "🤨",
  "🧐",
  "🤓",
  "😎",
  "🥳",
  "😏",
  "😒",
  "😞",
  "😔",
  "😟",
  "😕",
  "🙁",
  "☹️",
  "😣",
  "😖",
  "😫",
  "😩",
  "🥺",
  "😢",
  "😭",
  "😤",
  "😠",
  "😡",
  "🤬",
  "🤯",
  "😳",
  "🥵",
  "🥶",
  "😱",
];
export default function CreateArticlePage() {
  const [isImportTableModalOpen, setIsImportTableModalOpen] = useState(false);
  const [isNewTableModalOpen, setIsNewTableModalOpen] = useState(false);
  const [isHyperlinkModalOpen, setIsHyperlinkModalOpen] = useState(false);
  const tableHtmlRef = useRef(null); // สำหรับ Import HTML Table
  const hyperlinkTextRef = useRef(null); // NEW Ref สำหรับ Input Text to display
  const hyperlinkUrlRef = useRef(null); // NEW Ref สำหรับ Input URL Path
  const [attachedImageFiles, setAttachedImageFiles] = useState([]);
  const nextImagePlaceholderId = useRef(0);
  const newTableRowsRef = useRef(null); // NEW Ref สำหรับ Input Rows
  const newTableColsRef = useRef(null); // NEW Ref สำหรับ Input Cols
  const [activeTab, setActiveTab] = useState("Home");
  const [articleTitle, setArticleTitle] = useState("");
  // New state for tags
  const [tags, setTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState("");
  const MAX_TAGS = 5;
  const [showSection, setShowSection] = useState(true);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hashtag, setHashtag] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(null);
  const [articleStatus, setArticleStatus] = useState("private");
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const { t } = useTranslation();
  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      console.warn("Access token not found.");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API}/categories`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })
      .then((res) => res.json())
      .then((data) => {
        const cats = Array.isArray(data) ? data : data.categories || [];
        setCategories(cats);
      })
      .catch((err) => {
        console.error("Error loading categories:", err);
        setCategories([]); // fallback
      });
  }, []);

  useEffect(() => {
    // เมื่อเลือกหมวดหมู่หลักแล้ว ให้ set subcategories ตาม id ที่เลือก
    const selected = categories.find(
      (cat) => cat.id === Number(selectedCategoryId)
    );
    setSubCategories(selected?.subcategories || []);
  }, [selectedCategoryId, categories]);

  const editor = useEditor({
    extensions: [
      // ของเดิมคุณ
      ArticleImage.configure({
        inline: true,
        allowBase64: true,
      }),
      StarterKit.configure({
        textStyle: false,
        image: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
        bulletList: true,
        orderedList: true,
        listItem: true,
        blockquote: true,
        codeBlock: true,
        horizontalRule: true,
      }),
      ImageResize,
      Underline,
      CustomFontSize,
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      FontFamily,
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      Placeholder.configure({ placeholder: "เริ่มพิมพ์บทความของคุณ..." }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          target: "_blank",
          rel: "noopener noreferrer",
        },
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Hashtag,

      // 🔥 เพิ่มจากของที่คุณยังไม่มี
      Gapcursor,
      Dropcursor,
      CharacterCount.configure({ limit: 25000 }),
      BubbleMenu,
      FloatingMenu,
      HardBreak,
      HorizontalRule, // แม้คุณ enable ใน StarterKit ก็สามารถใช้ extension ตรงนี้ได้เพื่อ config เพิ่มเติม
      TaskList,
      TaskItem,
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: {
          items: ({ query }) => {
            return [
              { id: 1, label: "@delta" },
              { id: 2, label: "@support" },
            ].filter((item) =>
              item.label.toLowerCase().includes(query.toLowerCase())
            );
          },
          render: () => {
            // ต้องเขียน render UI dropdown ตามที่คุณใช้ (React, etc.)
            return { onStart: () => {}, onUpdate: () => {}, onExit: () => {} };
          },
        },
      }),
      Typography,
    ],
    content: "<p>เริ่มต้นพิมพ์บทความของคุณที่นี่...</p>",
  });

  const setFontSize = useCallback(
    (size) => {
      if (editor) {
        editor.chain().focus().setFontSize(size).run();
      }
    },
    [editor]
  );
  const handleFileChange = useCallback((event) => {
    const files = Array.from(event.target.files); // Convert FileList to an array
    if (files.length > 0) {
      setAttachedFiles((prevFiles) => [...prevFiles, ...files]);
      // Optional: Clear the input so the same file can be selected again after removal
      event.target.value = null;
    }
  }, []);

  const handleRemoveFile = useCallback((fileToRemove) => {
    setAttachedFiles((prevFiles) =>
      prevFiles.filter((file) => file !== fileToRemove)
    );
  }, []);
  const getHashtags = useCallback(() => {
    if (!editor) return [];
    const hashtags = [];
    editor.state.doc.descendants((node, pos) => {
      if (node.isText) {
        node.marks.forEach((mark) => {
          if (mark.type.name === "hashtag") {
            hashtags.push(mark.attrs.value);
          }
        });
      }
    });
    return Array.from(new Set(hashtags));
  }, [editor]);
  // Insert emoji at current cursor
  const insertEmoji = (emoji) => {
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  useEffect(() => {
    if (editor) {
      console.log("Tiptap editor initialized!");
      const commands = Object.keys(editor.chain());
      console.log("Available commands on editor.chain():", commands);
      const isInsertArticleImageAvailable =
        commands.includes("insertArticleImage");
      console.log(
        "Does insertArticleImage exist?",
        isInsertArticleImageAvailable
      );

      if (!isInsertArticleImageAvailable) {
        console.error(
          "CRITICAL ERROR: insertArticleImage command is NOT available. ArticleImage extension might not be loaded correctly."
        );
      } else {
        console.log(
          "SUCCESS: insertArticleImage command is available. Everything seems to be set up!"
        );
      }
    }
  }, [editor]);
  useEffect(() => {
    if (editor) {
      editor.on("update", () => {
        console.log(
          "Current TextStyle attributes:",
          editor.getAttributes("textStyle")
        );
        const currentHashtags = getHashtags();
        console.log("Current Hashtags in editor:", currentHashtags);
      });
    }
  }, [editor, getHashtags]);
  const handleInsertNewTable = useCallback(() => {
    if (editor && newTableRowsRef.current && newTableColsRef.current) {
      const rows = parseInt(newTableRowsRef.current.value, 10);
      const cols = parseInt(newTableColsRef.current.value, 10);

      // ตรวจสอบค่าว่าเป็นตัวเลขและมากกว่า 0
      if (isNaN(rows) || rows <= 0 || isNaN(cols) || cols <= 0) {
        Swal.fire({
          // ใช้ i18n.t() สำหรับ Title ของ SweetAlert
          title: t("article.alert.errorTitle"),
          // ใช้ i18n.t() สำหรับ Text/Message ของ SweetAlert
          text: t("article.alert.invalidTableDimensions"),
          icon: "error", // ใช้ไอคอน 'error' เพื่อบ่งบอกว่าเป็นข้อผิดพลาด
          confirmButtonText: t("article.alert.ok"),
        });
        return;
      }

      editor
        .chain()
        .focus()
        .insertTable({ rows, cols, withHeaderRow: true })
        .run();
      setIsNewTableModalOpen(false); // ปิด modal
      // Optional: Reset input values to default or clear them
      newTableRowsRef.current.value = "3";
      newTableColsRef.current.value = "3";
    }
  }, [editor]); // editor เป็น dependency
  // Handle adding a new tag
  const handleAddTag = useCallback(() => {
    const trimmedTag = newTagInput.trim(); // trimmedTag จะตัด spacebar หน้าหลังออกอยู่แล้ว
    const MAX_TAG_LENGTH = 20; // Define the maximum length for a single tag

    // ตรวจสอบว่าช่องว่างทั้งหมดหรือไม่หลังจาก trim
    if (trimmedTag === "") {
      // alert("กรุณากรอกแท็ก"); // ยกเลิกคอมเมนต์ถ้าต้องการแจ้งเตือน
      setNewTagInput(""); // ล้างช่อง input ถ้ากรอกแต่ spacebar
      return; // ไม่เพิ่มแท็กเปล่า
    }

    if (tags.length >= MAX_TAGS) {
      Swal.fire({
        icon: "warning",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.maxTags", { count: MAX_TAGS }),
      });
      return;
    }

    if (trimmedTag.length > MAX_TAG_LENGTH) {
      Swal.fire({
        icon: "warning",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.tagTooLong", { count: MAX_TAG_LENGTH }),
      });
      return;
    }

    if (tags.includes(trimmedTag)) {
      Swal.fire({
        icon: "info",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.tagExists", { tag: trimmedTag }),
      });
      setNewTagInput("");
      return;
    }

    setTags((prevTags) => {
      const updatedTags = [...prevTags, trimmedTag];
      console.log("Added tag:", trimmedTag);
      console.log("Current tags:", updatedTags);
      return updatedTags;
    });
    setNewTagInput("");
  }, [newTagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove) => {
    setTags((prevTags) => {
      const updatedTags = prevTags.filter((tag) => tag !== tagToRemove);
      console.log("Removed tag:", tagToRemove);
      console.log("Current tags:", updatedTags);
      return updatedTags;
    });
  }, []);

  const handleBrowseTag = () => {
    console.log("ค้นหาแท็ก:", newTagInput);
    // ส่งคำค้นไป backend หรือกรองภายใน
  };
  // ... (in CreateArticlePage component)
  function replaceImageSrcWithFilename(json) {
    if (!json || typeof json !== "object") return json;

    if (json.type === "articleImage" && json.attrs?.filename) {
      const fullFilename = json.attrs.filename;
      const filenameWithoutExt = fullFilename.split(".")[0]; // ลบนามสกุลออก

      return {
        ...json,
        attrs: {
          ...json.attrs,
          src: `{${filenameWithoutExt}}`, // 👈 เก็บแค่ชื่อไฟล์โดยไม่มี .jpg, .png
        },
      };
    }

    if (Array.isArray(json.content)) {
      return {
        ...json,
        content: json.content.map(replaceImageSrcWithFilename),
      };
    }

    return json;
  }

  const handleSaveArticle = useCallback(async () => {
    if (!editor) {
      Swal.fire({
        icon: "error",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.editorNotInitialized"),
      });
      return;
    }
    const result = await Swal.fire({
      title: t("article.alert.confirmSaveTitle"), // เช่น "คุณต้องการบันทึกบทความหรือไม่?"
      text: t("article.alert.confirmSaveText"), // เช่น "ตรวจสอบข้อมูลให้เรียบร้อยก่อนบันทึก"
      icon: "question",
      showCancelButton: true,
      confirmButtonText: t("article.alert.confirmButton"), // เช่น "ยืนยัน"
      cancelButtonText: t("article.alert.cancelButton"), // เช่น "ยกเลิก"
    });

    if (!result.isConfirmed) return;
    const rawJsonContent = editor.getJSON();
    const articleJsonContent = replaceImageSrcWithFilename(rawJsonContent);
    const title = articleTitle.trim();

    if (!title) {
      Swal.fire({
        icon: "error",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.emptyTitle"),
      });
      return;
    }

    const formData = new FormData();
    const foundHashtags = new Set();

    const extractHashtags = (content) => {
      if (!content) return;
      content.forEach((node) => {
        if (node.type === "text" && node.text) {
          const matches = node.text.match(HASHTAG_REGEX);
          if (matches) {
            matches.forEach((match) => foundHashtags.add(match));
          }
        }
        if (node.content) {
          extractHashtags(node.content);
        }
      });
    };

    extractHashtags(articleJsonContent.content);
    setHashtag(Array.from(foundHashtags));

    const isContentEmpty =
      !articleJsonContent ||
      !articleJsonContent.content ||
      articleJsonContent.content.length === 0 ||
      (articleJsonContent.content.length === 1 &&
        articleJsonContent.content[0].type === "paragraph" &&
        (!articleJsonContent.content[0].content ||
          articleJsonContent.content[0].content.length === 0));

    if (isContentEmpty) {
      Swal.fire({
        icon: "error",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.emptyContent"),
      });
      return;
    }

    formData.append("title", title);
    formData.append("content", JSON.stringify(articleJsonContent));
    formData.append("tags", JSON.stringify(tags)); // เปลี่ยนจาก categories → tags
    formData.append("hashtags", JSON.stringify(Array.from(foundHashtags)));

    // start_date และ end_date
    if (startDate) {
      const formattedStartDate = new Date(startDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      formData.append("start_date", formattedStartDate);
    }

    if (endDate) {
      const formattedEndDate = new Date(endDate)
        .toISOString()
        .slice(0, 19)
        .replace("T", " ");
      formData.append("end_date", formattedEndDate);
    }

    // category
    if (selectedCategoryId) {
      formData.append("category_ids", String(selectedCategoryId));
    }

    // subcategory
    if (selectedSubCategoryId) {
      formData.append("subcategory_ids", String(selectedSubCategoryId));
    }

    // embedded_files (ส่งเฉพาะถ้ามี)
    if (attachedImageFiles.length > 0) {
      attachedImageFiles.forEach((imageObj) => {
        formData.append("embedded_files", imageObj.file, imageObj.filename);
      });
    }

    if (attachedImageFiles.length > 0) {
      attachedImageFiles.forEach((imageObj) => {
        if (imageObj.file instanceof Blob) {
          formData.append("embedded_files", imageObj.file, imageObj.filename);
        }
      });
    }

    const accessToken = localStorage.getItem("access_token");
    if (!accessToken) {
      Swal.fire({
        icon: "error",
        title: t("article.alert.errorTitle"),
        text: t("article.alert.missingToken"),
      });
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API}/articles`, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        let errorDetail = "บันทึกบทความไม่สำเร็จ.";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || errorData.message || errorDetail;
        } catch (jsonError) {
          errorDetail += ` สถานะ: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorDetail);
      }

      const savedArticle = await response.json();
      Swal.fire({
        icon: "success",
        title: t("article.alert.successTitle"),
        text: t("article.alert.articleSaved"),
      });

      console.log("บทความที่บันทึก:", savedArticle);

      // reset form
      setAttachedImageFiles([]);
      setAttachedFiles([]);
      setArticleTitle("");
      setTags([]);
      setStartDate("");
      setEndDate("");
      setHashtag("");
      setSelectedCategoryId(null);
      setSelectedSubCategoryId(null);
      setArticleStatus("private");
      editor.commands.clearContent(true);
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการบันทึกบทความ:", error);
      Swal.fire({
        icon: "error",
        title: t("article.alert.errorTitle"),
        text: `${t("article.alert.saveFailed")}: ${error.message}`,
      });
    }
  }, [
    editor,
    attachedImageFiles,
    attachedFiles,
    articleTitle,
    tags,
    startDate,
    endDate,
    hashtag,
    selectedCategoryId,
    selectedSubCategoryId,
    articleStatus,
    setArticleTitle,
  ]);

  const handleImageUpload = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (file && editor) {
        if (!file.type.startsWith("image/")) {
          Swal.fire({
            icon: "warning",
            title: t("article.alert.errorTitle"),
            text: t("article.alert.selectImageFileOnly"),
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
          const base64Url = e.target.result;

          // สร้างชื่อไฟล์ที่ไม่ซ้ำกัน
          const generatedFilename = `${Date.now()}-${file.name.replace(
            /\s+/g,
            "_"
          )}`;

          // เก็บ File object และชื่อไฟล์นี้ไว้ใน state
          setAttachedImageFiles((prevFiles) => [
            ...prevFiles,
            { file: file, filename: generatedFilename },
          ]);

          // แทรก Node รูปภาพใน Editor โดยใช้ Command ที่กำหนดไว้ใน Extension
          editor
            .chain()
            .focus()
            .insertArticleImage({ src: base64Url, filename: generatedFilename }) // ใช้ Command ที่ ArticleImage Extension มีให้
            .run();
        };
        reader.readAsDataURL(file);
      }
      event.target.value = null;
    },
    [editor, setAttachedImageFiles]
  );

  const handleImportJson = useCallback(
    (event) => {
      const file = event.target.files[0];
      if (!file) {
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);

          // Check if editor exists
          if (editor) {
            // Set article title
            if (importedData.title) {
              setArticleTitle(importedData.title);
            } else {
              setArticleTitle(""); // Clear if no title in JSON
            }

            // Set tags
            if (Array.isArray(importedData.tags)) {
              setTags(importedData.tags);
            } else {
              setTags([]); // Clear if no tags or invalid format
            }

            // Set editor content (prioritize contentHtml if available, otherwise use content JSON)
            if (importedData.contentHtml) {
              editor.commands.setContent(importedData.contentHtml);
            } else if (importedData.content) {
              editor.commands.setContent(importedData.content);
            } else {
              editor.commands.setContent(
                "<p>No content found in imported JSON.</p>"
              );
            }

            Swal.fire({
              icon: "success",
              title: t("article.alert.successTitle"),
              text: t("article.alert.importSuccess"),
            });
          }
        } catch (error) {
          console.error("Error parsing JSON or setting editor content:", error);
          Swal.fire({
            icon: "error",
            title: t("article.alert.errorTitle"),
            text: t("article.alert.invalidJsonFile"),
          });
        }
      };
      reader.readAsText(file); // Read the file as text
    },
    [editor, setArticleTitle, setTags]
  ); // Add setArticleTitle and setTags to dependencies

  const handleExportJson = useCallback(() => {
    if (!editor) return;

    const contentJson = editor.getJSON();
    const currentHashtags = getHashtags();
    const exportData = {
      title: articleTitle,
      content: contentJson,
      hashtags: currentHashtags,
      tags: tags, // Include user-defined tags in the exported JSON
    };

    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${articleTitle || "article"}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [editor, articleTitle, getHashtags, tags]); // Added tags to dependency array

  const handleExportPdf = useCallback(async () => {
    if (!editor) return;

    const element = document.createElement("div");
    element.innerHTML = `
      <div style="padding: 20px;">
        <h1>${articleTitle}</h1>
        ${editor.getHTML()}
      </div>
    `;

    const opt = {
      margin: 1,
      filename: `${articleTitle || "article"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    const html2pdfModule = await html2pdf;
    if (html2pdfModule) {
      html2pdfModule().set(opt).from(element).save();
    } else {
      Swal.fire({
        icon: "warning",
        title: t("article.alert.warningTitle"),
        text: t("article.alert.pdfLibraryNotLoaded"),
      });
    }
  }, [editor, articleTitle]);

  const handleHyperlink = useCallback(() => {
    // เมื่อกดปุ่ม ให้เปิด Modal
    setIsHyperlinkModalOpen(true);
    // (Optional) ถ้ามีข้อความถูกเลือกใน editor อยู่แล้ว ให้เอามาแสดงในช่อง "Text to display"
    // Note: ต้องใช้ setTimeout เพราะ editor state อาจยังไม่พร้อมทันที
    setTimeout(() => {
      if (editor && hyperlinkTextRef.current) {
        const selectedText =
          editor.state.selection.content().content.firstChild?.text;
        if (selectedText) {
          hyperlinkTextRef.current.value = selectedText;
        }
      }
    }, 0);
  }, [editor]); // editor เป็น dependency
  const handleInsertHyperlink = useCallback(() => {
    if (editor && hyperlinkTextRef.current && hyperlinkUrlRef.current) {
      const text = hyperlinkTextRef.current.value.trim();
      let url = hyperlinkUrlRef.current.value.trim();

      if (!text) {
        Swal.fire({
          icon: "warning",
          title: t("article.alert.errorTitle"),
          text: t("article.alert.enterText"),
        });
        return;
      }
      if (!url) {
        Swal.fire({
          icon: "warning",
          title: t("article.alert.errorTitle"),
          text: t("article.alert.enterUrl"),
        });
        return;
      }

      // Optional: เพิ่ม "http://" หรือ "https://" ถ้าผู้ใช้ไม่ได้ใส่
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = `http://${url}`;
      }

      // แทรกลิงก์เข้าไปใน editor
      editor.chain().focus().setLink({ href: url }).insertContent(text).run();

      setIsHyperlinkModalOpen(false); // ปิด Modal
      hyperlinkTextRef.current.value = ""; // เคลียร์ input
      hyperlinkUrlRef.current.value = ""; // เคลียร์ input
      Swal.fire({
        icon: "success",
        title: t("article.alert.successTitle"),
        text: t("article.alert.hyperlinkInserted"),
      });
    }
  }, [editor]); // editor เป็น dependency

  if (!editor) {
    return (
      <>
        <Navbar />
        <div className={styles.pageBackground}>
          <div className={styles.loadingContainer}>
            <p>กำลังโหลด Editor...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className={styles.groupSection}>
        {/* Header toggle */}
        <div
          className={styles.sectionHeader}
          onClick={() => setShowSection(!showSection)}
        >
          <h2 className={styles.groupTitle}>{t("article.article")}</h2>
          <FontAwesomeIcon icon={showSection ? faChevronUp : faChevronDown} />
        </div>

        {/* Toggle content */}
        {showSection && (
          <div className={styles.sectionContent}>
            {/* ชื่อบทความ */}
            <h1 className={styles.title}>{t("article.createarticle")}</h1>
            <label className={styles.label}>{t("article.name")}</label>
            <input
              type="text"
              placeholder={t("article.nameplaceholder")}
              className={styles.inputTitle}
              value={articleTitle}
              onChange={(e) => setArticleTitle(e.target.value)}
            />

            {/* แท็ก */}
            <div className={styles.inputGroup}>
              <label className={styles.label}>{t("article.tag")}</label>
              <div className={styles.tagControlRow}>
                <input
                  type="text"
                  placeholder={t("article.tagplaceholder")}
                  className={styles.tagInput}
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                />
                <button
                  onClick={handleAddTag}
                  className={`${styles.tagAddButton} ${
                    newTagInput.trim() === "" ? styles.disabledButton : ""
                  }`}
                  title={t("article.addtag")}
                  disabled={newTagInput.trim() === ""}
                >
                  <FontAwesomeIcon icon={faPlus} /> {t("article.add")}
                </button>
                <button
                  onClick={handleBrowseTag}
                  className={styles.tagSearchButton}
                  title={t("article.searchtag")}
                >
                  <FontAwesomeIcon icon={faSearch} /> {t("article.search")}
                </button>
              </div>

              <div className={styles.tagsDisplay}>
                {tags.length > 0 ? (
                  tags.map((tag, index) => (
                    <span key={index} className={styles.tagItem}>
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className={styles.removeTagButton}
                        title={t("article.deletetag")}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className={styles.noTags}>{t("article.noselecttag")}</p>
                )}
              </div>
            </div>

            {/* หมวดหมู่หลัก + ย่อย */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("article.category")}</label>
                <select
                  className={styles.select}
                  value={selectedCategoryId || ""}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                >
                  <option value="">--{t("article.selectcategory")} --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* หมวดหมู่ย่อย */}
              <div className={styles.inputGroup}>
                <label className={styles.label}>
                  {t("article.subcategory")}
                </label>
                <select
                  className={styles.select}
                  value={selectedSubCategoryId || ""}
                  onChange={(e) => setSelectedSubCategoryId(e.target.value)}
                >
                  <option value="">
                    -- {t("article.selectsubcategory")} --
                  </option>
                  {subCategories.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("article.status")}</label>
                <select
                  className={styles.select}
                  value={articleStatus}
                  onChange={(e) => setArticleStatus(e.target.value)}
                >
                  <option value="private">{t("article.private")}</option>
                  <option value="draft">{t("article.draft")}</option>
                  <option value="public">{t("article.public")}</option>
                </select>
              </div>
            </div>

            {/* สถานะบทความ */}

            {/* วันที่เริ่มต้น + วันที่สิ้นสุด */}
            <div className={styles.inputRow}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("article.startdate")}</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <label className={styles.label}>{t("article.enddate")}</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={styles.input}
                />
              </div>
            </div>

            {/* แนบไฟล์ */}
            <div className={styles.fileAttachmentContainer}>
              <label htmlFor="file-upload" className={styles.attachFileButton}>
                <FontAwesomeIcon icon={faPlus} /> {t("article.attachfile")}
              </label>
              <input
                id="file-upload"
                type="file"
                multiple
                onChange={handleFileChange}
                className={styles.hiddenFileInput}
              />
              <div className={styles.attachedFilesDisplay}>
                {attachedFiles.length > 0 ? (
                  attachedFiles.map((file, index) => (
                    <span key={index} className={styles.attachedFileItem}>
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      <button
                        onClick={() => handleRemoveFile(file)}
                        className={styles.removeFileButton}
                        title={t("article.deletefile")}
                      >
                        <FontAwesomeIcon icon={faTimes} />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className={styles.noFilesMessage}>
                    {t("article.noattachfile")}
                  </p>
                )}
              </div>
              <button
                className={styles.saveButton}
                onClick={handleSaveArticle}
                title="บันทึกบทความ"
              >
                <FontAwesomeIcon icon={faPlus} /> {t("article.save")}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className={styles.pageBackground}>
        {/* Sticky Toolbar Section */}
        <div className={styles.stickyToolbar}>
          {/* Tab Navigation */}
          <div className={styles.tabBar}>
            <button
              className={`${styles.tabButton} ${
                activeTab === "Home" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("Home")}
            >
              Home
            </button>
            <button
              className={`${styles.tabButton} ${
                activeTab === "File" ? styles.activeTab : ""
              }`}
              onClick={() => setActiveTab("File")}
            >
              File
            </button>
          </div>
          {/* Menu Bar (Toolbox) - Render based on activeTab */}
          {activeTab === "Home" && (
            <div className={styles.menuBar}>
              {/* Undo/Redo and Alignment Group */}
              <div className={styles.menuGroup}>
                <button
                  onClick={() => editor.chain().focus().undo().run()}
                  disabled={!editor.can().undo()}
                  title="Undo"
                >
                  <FontAwesomeIcon icon={faUndo} />
                </button>
                <button
                  onClick={() => editor.chain().focus().redo().run()}
                  disabled={!editor.can().redo()}
                  title="Redo"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={
                    editor.isActive({ textAlign: "left" }) ? styles.active : ""
                  }
                  title="Align Left"
                >
                  <FontAwesomeIcon icon={faAlignLeft} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={
                    editor.isActive({ textAlign: "center" })
                      ? styles.active
                      : ""
                  }
                  title="Center"
                >
                  <FontAwesomeIcon icon={faAlignCenter} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("right").run()
                  }
                  className={
                    editor.isActive({ textAlign: "right" }) ? styles.active : ""
                  }
                  title="Align Right"
                >
                  <FontAwesomeIcon icon={faAlignRight} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("justify").run()
                  }
                  className={
                    editor.isActive({ textAlign: "justify" })
                      ? styles.active
                      : ""
                  }
                  title="Justify"
                >
                  <FontAwesomeIcon icon={faAlignJustify} />
                </button>
              </div>

              {/* Font Group */}
              <div className={styles.menuGroup}>
                <select
                  onChange={(e) =>
                    editor.chain().focus().setFontFamily(e.target.value).run()
                  }
                  value={
                    editor.getAttributes("textStyle").fontFamily || "Arial"
                  }
                  title="Font Family"
                  className={styles.selectControl}
                >
                  <option value="Arial">Arial</option>
                  <option value="Verdana">Verdana</option>
                  <option value="Tahoma">Tahoma</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Palatino Linotype">Palatino Linotype</option>
                  <option value="Segoe UI">Segoe UI</option>
                </select>

                <select
                  onChange={(e) => {
                    console.log("Selected Font Size:", e.target.value);
                    setFontSize(e.target.value);
                  }}
                  value={editor.getAttributes("textStyle").fontSize}
                  title="Font Size"
                  className={styles.selectControl}
                >
                  {FONT_SIZES.map((size) => (
                    <option key={size} value={size}>
                      {parseInt(size)}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  className={editor.isActive("bold") ? styles.active : ""}
                  title="Bold"
                >
                  <FontAwesomeIcon icon={faBold} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  className={editor.isActive("italic") ? styles.active : ""}
                  title="Italic"
                >
                  <FontAwesomeIcon icon={faItalic} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  className={editor.isActive("underline") ? styles.active : ""}
                  title="Underline"
                >
                  <FontAwesomeIcon icon={faUnderline} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={editor.isActive("strike") ? styles.active : ""}
                  title="Strikethrough"
                >
                  <FontAwesomeIcon icon={faStrikethrough} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  className={editor.isActive("subscript") ? styles.active : ""}
                  title="Subscript"
                >
                  <FontAwesomeIcon icon={faSubscript} />
                </button>
                <div className={styles.colorPickerWrapper}>
                  <input
                    type="color"
                    id="fontColorPicker"
                    onChange={(e) =>
                      editor.chain().focus().setColor(e.target.value).run()
                    }
                    title="Font Color"
                    value={editor.getAttributes("textStyle").color || "#000000"}
                    className={styles.hiddenColorInput}
                  />
                  <button
                    onClick={() =>
                      document.getElementById("fontColorPicker").click()
                    }
                    title="Font Color"
                    className={styles.iconButton}
                  >
                    <FontAwesomeIcon
                      icon={faFont}
                      style={{
                        color:
                          editor.getAttributes("textStyle").color || "#000000",
                      }}
                    />
                  </button>
                  <div
                    className={styles.colorIndicator}
                    style={{
                      backgroundColor:
                        editor.getAttributes("textStyle").color || "#000000",
                    }}
                  ></div>
                </div>

                {/* Highlight Color Button */}
                <div className={styles.colorPickerWrapper}>
                  <input
                    type="color"
                    id="highlightColorPicker"
                    onChange={(e) =>
                      editor
                        .chain()
                        .focus()
                        .setHighlight({ color: e.target.value })
                        .run()
                    }
                    title="Highlight Color"
                    value={editor.getAttributes("highlight").color || "#FFFFFF"}
                    className={styles.hiddenColorInput}
                  />
                  <button
                    onClick={() =>
                      document.getElementById("highlightColorPicker").click()
                    }
                    title="Highlight Color"
                    className={styles.iconButton}
                  >
                    <FontAwesomeIcon
                      icon={faFillDrip}
                      style={{
                        color:
                          editor.getAttributes("highlight").color || "#FFFFFF",
                      }}
                    />
                  </button>
                  <div
                    className={styles.colorIndicator}
                    style={{
                      backgroundColor:
                        editor.getAttributes("highlight").color || "#FFFFFF",
                    }}
                  ></div>
                </div>
                <button
                  onClick={() => editor.chain().focus().unsetAllMarks().run()}
                  title="Clear All Formatting"
                >
                  <FontAwesomeIcon icon={faEraser} />
                </button>
                <input
                  id="image-upload-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className={styles.hiddenFileInput}
                />
                {/* ปุ่ม Insert Horizontal Rule (FloatingMenu เหมาะใช้เมนูนี้) */}
                <button
                  type="button"
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                  className={styles.menuGroupButton}
                  title="Insert Horizontal Rule"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <div style={{ position: "relative" }}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    title="Insert Emoji"
                    style={{ fontSize: "18px" }}
                  >
                    <FontAwesomeIcon icon={faSmile} />
                  </button>

                  {showEmojiPicker && (
                    <div
                      style={{
                        position: "absolute",
                        top: "30px",
                        left: 0,
                        border: "1px solid #ccc",
                        padding: "5px",
                        backgroundColor: "white",
                        zIndex: 100,
                        width: "150px",
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "5px",
                        cursor: "pointer",
                      }}
                    >
                      {emojiList.map((emoji) => (
                        <span
                          key={emoji}
                          onClick={() => {
                            insertEmoji(emoji);
                            setShowEmojiPicker(false);
                          }}
                          style={{ fontSize: "20px" }}
                          aria-label="emoji"
                        >
                          {emoji}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* ปุ่ม Insert Hyperlink */}
                <button
                  onClick={handleHyperlink}
                  className={styles.menuGroupButton}
                  title="Insert Hyperlink"
                >
                  <FontAwesomeIcon icon={faLink} />
                </button>

                {isHyperlinkModalOpen && (
                  <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                      <h3>Insert Hyperlink</h3>
                      <div className={styles.modalInputGroup}>
                        <label htmlFor="hyperlinkText">Text to display:</label>
                        <input
                          id="hyperlinkText"
                          type="text"
                          className={styles.modalInput}
                          ref={hyperlinkTextRef}
                          placeholder="Enter text to display"
                        />
                      </div>
                      <div className={styles.modalInputGroup}>
                        <label htmlFor="hyperlinkUrl">URL Path:</label>
                        <input
                          id="hyperlinkUrl"
                          type="url" // ใช้ type="url" เพื่อให้ browser ช่วยตรวจสอบ format
                          className={styles.modalInput}
                          ref={hyperlinkUrlRef}
                          placeholder="e.g., https://yourdomain.com/article/123"
                        />
                      </div>
                      <div className={styles.modalActions}>
                        <button
                          onClick={handleInsertHyperlink} // เรียกฟังก์ชันเมื่อกด "Insert Link"
                          className={styles.modalActionButton}
                        >
                          Insert Link
                        </button>
                        <button
                          onClick={() => setIsHyperlinkModalOpen(false)}
                          className={styles.modalCancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* NEW: Insert a new blank table button (optional, but very useful) */}
                <button
                  onClick={() => setIsNewTableModalOpen(true)} // เปิด Modal แทน
                  title="Insert New Table"
                  className={styles.menuGroupButton}
                >
                  <FontAwesomeIcon icon={faTable} />
                </button>
                {isNewTableModalOpen && (
                  <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
                      <h3>Insert New Table</h3>
                      <div className={styles.modalInputGroup}>
                        <label htmlFor="tableRows">Rows:</label>
                        <input
                          id="tableRows"
                          type="number"
                          min="1"
                          defaultValue="3" // ค่าเริ่มต้น 3 แถว
                          className={styles.modalInput}
                          ref={newTableRowsRef}
                        />
                      </div>
                      <div className={styles.modalInputGroup}>
                        <label htmlFor="tableCols">Columns:</label>
                        <input
                          id="tableCols"
                          type="number"
                          min="1"
                          defaultValue="3" // ค่าเริ่มต้น 3 คอลัมน์
                          className={styles.modalInput}
                          ref={newTableColsRef}
                        />
                      </div>
                      <div className={styles.modalActions}>
                        <button
                          onClick={handleInsertNewTable}
                          className={styles.modalActionButton}
                        >
                          Insert Table
                        </button>
                        <button
                          onClick={() => setIsNewTableModalOpen(false)}
                          className={styles.modalCancelButton}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Save Button */}
                <button
                  onClick={handleSaveArticle}
                  title="Save Article"
                  className={styles.menuGroupButton}
                >
                  <FontAwesomeIcon icon={faSave} />
                </button>
              </div>
            </div>
          )}
          {/* File Tab Content */}
          {activeTab === "File" && (
            <div className={styles.menuBar}>
              <div className={styles.menuGroup}>
                <input
                  id="json-import-file"
                  type="file"
                  accept=".json"
                  onChange={handleImportJson}
                  className={styles.hiddenFileInput}
                />

                <button
                  type="button"
                  onClick={() =>
                    document.getElementById("json-import-file").click()
                  }
                  className={styles.menuGroupButton}
                  title="Import JSON"
                >
                  <FontAwesomeIcon icon={faFileImport} /> Import JSON
                </button>
                <button onClick={handleExportJson} title="Export as JSON">
                  <FontAwesomeIcon icon={faFileExport} /> Export JSON
                </button>
                <button onClick={handleExportPdf} title="Export as PDF">
                  <FontAwesomeIcon icon={faFileExport} /> Export PDF
                </button>
              </div>
            </div>
          )}
        </div>
        {/* This div creates space for the sticky toolbar so content doesn't get hidden behind it */}
        <div className={styles.toolbarSpacer}></div>
        {/* Editor Content is now within its own container */}
        <div className={styles.editorContainer}>
          <EditorContent editor={editor} className={styles.editor} />
        </div>
      </div>
    </>
  );
}
