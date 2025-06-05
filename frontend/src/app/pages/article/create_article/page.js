"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import {
  faBold,
  faItalic,
  faUnderline,
  faAlignLeft,
  faAlignCenter,
  faAlignRight,
  faAlignJustify,
  faListUl,
  faListOl,
  faCode,
  faQuoteRight,
  faTable,
  faMinus,
  faStrikethrough,
  faSuperscript,
  faSubscript,
  faEraser,
  faPaintBrush,
  faCut,
  faCopy,
  faPaste,
  faSearch,
  faExchangeAlt,
  faImage,
  faFileAlt,
  faSave,
  faFileExport,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import ResizableImage from "tiptap-extension-resizable-image";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import TextAlign from "@tiptap/extension-text-align";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import CodeBlock from "@tiptap/extension-code-block";
import Blockquote from "@tiptap/extension-blockquote";
import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";
import ListItem from "@tiptap/extension-list-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";

import Navbar from "../../../component/Navbar";
import styles from "../../../style/create_article.module.css";

const html2pdf = dynamic(() => import("html2pdf.js"), { ssr: false });

// Custom Font Size Extension for Tiptap
const CustomFontSize = TextStyle.extend({
  addAttributes() {
    return {
      fontSize: {
        default: null,
        parseHTML: (element) => element.style.fontSize,
        renderHTML: (attributes) => {
          if (!attributes.fontSize) {
            return {};
          }
          return { style: `font-size: ${attributes.fontSize}` };
        },
      },
    };
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize) =>
        ({ commands }) => {
          return commands.updateAttributes("textStyle", { fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.updateAttributes("textStyle", { fontSize: null });
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

// กำหนด Font ที่จะใช้ใน dropdown
// ควรเป็น Font ที่มีในระบบของผู้ใช้หรือคุณได้โหลดไว้ใน CSS แล้ว
const FONT_FAMILIES = [
  "Arial",
  "Verdana",
  "Tahoma",
  "Times New Roman",
  "Courier New",
  "Georgia",
  "Palatino Linotype",
  "Segoe UI",
  "sans-serif", // generic family
  "serif", // generic family
  "monospace", // generic family
  // เพิ่ม Font อื่นๆ ที่ต้องการและได้โหลดไว้ใน CSS แล้ว
];

export default function CreateArticlePage() {
  const [activeTab, setActiveTab] = useState("Home");
  const [articleTitle, setArticleTitle] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        textStyle: false, // ปิด default textStyle เพื่อใช้ CustomFontSize
      }),
      Underline,
      CustomFontSize, // ใช้ CustomFontSize ของเรา
      Color,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      // ตั้งค่า FontFamily Extension ให้ถูกต้อง
      FontFamily.configure({
        // ระบุชนิดของ Node ที่สามารถเปลี่ยน Font ได้ (เช่น textStyle, paragraph, heading)
        // ถ้าไม่ระบุ, โดย default จะใช้กับ `textStyle` ซึ่ง CustomFontSize ของเราก็ใช้ `textStyle`
        // types: ['textStyle'], // ตัวอย่าง: ถ้าต้องการให้มีผลกับ textStyle เท่านั้น
      }),
      Highlight.configure({ multicolor: true }),
      Superscript,
      Subscript,
      Placeholder.configure({ placeholder: "เริ่มพิมพ์บทความของคุณ..." }),
      //   ResizableImage.configure({
      //     inline: true,
      //     allowBase64: true,
      //   }),
      Link.configure({
        openOnClick: true,
        autolink: true,
      }),
      HorizontalRule,
      CodeBlock,
      Blockquote,
      BulletList,
      OrderedList,
      ListItem,
      TaskList,
      TaskItem,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
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

  const addImage = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("URL รูปภาพ:");
    if (url) {
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("data:image/")
      ) {
        editor.chain().focus().setImage({ src: url }).run();
      } else {
        alert("URL รูปภาพไม่ถูกต้อง");
      }
    }
  }, [editor]);

  const addFile = useCallback(() => {
    if (!editor) return;

    const url = window.prompt("URL ไฟล์:");
    if (url) {
      const fileName = url.substring(url.lastIndexOf("/") + 1);
      editor
        .chain()
        .focus()
        .setLink({ href: url, target: "_blank" })
        .insertContent(fileName || "ดาวน์โหลดไฟล์")
        .run();
      alert("ไฟล์ถูกแทรกเป็นลิงก์แล้ว (ต้องแน่ใจว่า URL ไฟล์ถูกต้อง)");
    } else {
      alert("กรุณาป้อน URL ของไฟล์");
    }
  }, [editor]);

  const handleFind = useCallback(() => {
    const searchTerm = prompt("ป้อนคำที่ต้องการค้นหา:");
    if (searchTerm) {
      window.find(searchTerm);
      alert("ใช้ Ctrl+G หรือ F3 เพื่อค้นหาคำถัดไป");
    }
  }, []);

  const handleReplace = useCallback(() => {
    if (!editor) return;

    const searchTerm = prompt("ป้อนคำที่ต้องการค้นหา:");
    if (!searchTerm) return;

    const replaceTerm = prompt(`แทนที่ "${searchTerm}" ด้วยคำว่า:`);
    if (replaceTerm === null) return;

    const currentContent = editor.getHTML();
    const newContent = currentContent.replaceAll(
      new RegExp(searchTerm, "g"),
      replaceTerm
    );

    editor.chain().focus().setContent(newContent).run();
    alert(
      `ทำการแทนที่คำว่า "${searchTerm}" ด้วย "${replaceTerm}" เรียบร้อยแล้ว`
    );
  }, [editor]);

  const handleFormatPainter = useCallback(() => {
    alert(
      "ฟังก์ชัน 'คัดลอกรูปแบบ' ต้องมีการพัฒนา Logic ที่ซับซ้อนเพื่อจัดเก็บและนำรูปแบบไปใช้กับข้อความที่เลือก"
    );
  }, []);

  const handleSaveArticle = useCallback(() => {
    if (!editor) return;

    const contentJson = editor.getJSON();
    const contentHtml = editor.getHTML();
    const articleData = {
      title: articleTitle,
      content: contentJson,
      contentHtml: contentHtml,
      createdAt: new Date().toISOString(),
    };

    console.log("Saving article data:", articleData);
    alert("บันทึกบทความ (ข้อมูลถูกแสดงใน Console)");
  }, [editor, articleTitle]);

  const handleExportJson = useCallback(() => {
    if (!editor) return;

    const contentJson = editor.getJSON();
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(contentJson, null, 2));
    const downloadAnchorNode = document.createElement("a");
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute(
      "download",
      `${articleTitle || "article"}.json`
    );
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [editor, articleTitle]);

  const handleExportPdf = useCallback(async () => {
    if (!editor) return;

    const element = document.createElement("div");
    element.innerHTML = `
      <h1>${articleTitle}</h1>
      ${editor.getHTML()}
    `;

    const opt = {
      margin: 1,
      filename: `${articleTitle || "article"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    };

    const html2pdfModule = await html2pdf;
    html2pdfModule().set(opt).from(element).save();
  }, [editor, articleTitle]);

  if (!editor) {
    return (
      <div className={styles.pageBackground}>
        <div className={styles.editorContainer}>
          <p>กำลังโหลด Editor...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />

      <div className={styles.pageBackground}>
        <div className={styles.editorContainer}>
          <h1 className={styles.title}>สร้างบทความ</h1>
          <input
            type="text"
            placeholder="กรอกชื่อบทความ..."
            className={styles.inputTitle}
            value={articleTitle}
            onChange={(e) => setArticleTitle(e.target.value)}
          />

          {activeTab === "Home" && (
            <div className={styles.menuBar}>
              {/* Clipboard Group */}
              <div className={styles.menuGroup}>
                <button onClick={() => document.execCommand("cut")} title="Cut">
                  <FontAwesomeIcon icon={faCut} />
                </button>
                <button
                  onClick={() => document.execCommand("copy")}
                  title="Copy"
                >
                  <FontAwesomeIcon icon={faCopy} />
                </button>
                <button
                  onClick={() => document.execCommand("paste")}
                  title="Paste"
                >
                  <FontAwesomeIcon icon={faPaste} />
                </button>
                <button onClick={handleFormatPainter} title="Format Painter">
                  <FontAwesomeIcon icon={faPaintBrush} />
                </button>
                <div className={styles.menuGroupLabel}>Clipboard</div>
              </div>

              {/* Font Group */}
              <div className={styles.menuGroup}>
                <select
                  onChange={(e) =>
                    // เรียกใช้คำสั่ง setFontFamily ที่มากับ FontFamily Extension
                    editor.chain().focus().setFontFamily(e.target.value).run()
                  }
                  // ดึงค่า fontFamily ปัจจุบันจาก editor.getAttributes("textStyle").fontFamily
                  // หรือจาก editor.getAttributes("fontFamily") หากมี
                  // หากไม่มีค่า ให้ใช้ค่าเริ่มต้น เช่น "Arial"
                  value={
                    editor.getAttributes("textStyle").fontFamily || "Arial"
                  }
                  title="Font Family"
                >
                  {FONT_FAMILIES.map((font) => (
                    <option key={font} value={font}>
                      {font}
                    </option>
                  ))}
                </select>

                <select
                  onChange={(e) => {
                    setFontSize(e.target.value);
                  }}
                  value={editor.getAttributes("textStyle").fontSize || "16px"}
                  title="Font Size"
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
                  onClick={() =>
                    editor.chain().focus().toggleSuperscript().run()
                  }
                  className={
                    editor.isActive("superscript") ? styles.active : ""
                  }
                  title="Superscript"
                >
                  <FontAwesomeIcon icon={faSuperscript} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleSubscript().run()}
                  className={editor.isActive("subscript") ? styles.active : ""}
                  title="Subscript"
                >
                  <FontAwesomeIcon icon={faSubscript} />
                </button>

                <input
                  type="color"
                  onChange={(e) =>
                    editor.chain().focus().setColor(e.target.value).run()
                  }
                  title="Font Color"
                  value={editor.getAttributes("textStyle").color || "#ffffff"}
                />
                <input
                  type="color"
                  onChange={(e) =>
                    editor
                      .chain()
                      .focus()
                      .setHighlight({ color: e.target.value })
                      .run()
                  }
                  title="Highlight Color"
                  value={editor.getAttributes("highlight").color || "#ffffff"}
                />
                <button
                  onClick={() => editor.chain().focus().unsetAllMarks().run()}
                  title="Clear All Formatting"
                >
                  <FontAwesomeIcon icon={faEraser} />
                </button>
                <div className={styles.menuGroupLabel}>Font</div>
              </div>

              {/* Paragraph Group */}
              <div className={styles.menuGroup}>
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
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className={editor.isActive("bulletList") ? styles.active : ""}
                  title="Bullets"
                >
                  <FontAwesomeIcon icon={faListUl} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className={
                    editor.isActive("orderedList") ? styles.active : ""
                  }
                  title="Numbering"
                >
                  <FontAwesomeIcon icon={faListOl} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setHorizontalRule().run()
                  }
                  title="Horizontal Rule"
                >
                  <FontAwesomeIcon icon={faMinus} />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                  className={editor.isActive("codeBlock") ? styles.active : ""}
                  title="Code Block"
                >
                  <FontAwesomeIcon icon={faCode} />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className={editor.isActive("blockquote") ? styles.active : ""}
                  title="Blockquote"
                >
                  <FontAwesomeIcon icon={faQuoteRight} />
                </button>
                <button
                  onClick={() =>
                    editor
                      .chain()
                      .focus()
                      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                      .run()
                  }
                  title="Insert Table"
                >
                  <FontAwesomeIcon icon={faTable} />
                </button>
                <div className={styles.menuGroupLabel}>Paragraph</div>
              </div>

              {/* Insert Group */}
              <div className={styles.menuGroup}>
                <button onClick={addImage} title="Insert Image">
                  <FontAwesomeIcon icon={faImage} /> Image
                </button>
                <button onClick={addFile} title="Insert File">
                  <FontAwesomeIcon icon={faFileAlt} /> File
                </button>
                <div className={styles.menuGroupLabel}>Insert</div>
              </div>

              {/* Styles Group */}
              <div className={styles.menuGroup}>
                <button
                  onClick={() => editor.chain().focus().setParagraph().run()}
                  className={
                    editor.isActive("paragraph") &&
                    !editor.isActive("blockquote")
                      ? styles.active
                      : ""
                  }
                  title="Normal"
                >
                  Normal
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 1 }).run()
                  }
                  className={
                    editor.isActive("heading", { level: 1 })
                      ? styles.active
                      : ""
                  }
                  title="Heading 1"
                >
                  H1
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleHeading({ level: 2 }).run()
                  }
                  className={
                    editor.isActive("heading", { level: 2 })
                      ? styles.active
                      : ""
                  }
                  title="Heading 2"
                >
                  H2
                </button>
                <div className={styles.menuGroupLabel}>Styles</div>
              </div>

              {/* Editing Group */}
              <div className={styles.menuGroup}>
                <button onClick={handleFind} title="Find">
                  <FontAwesomeIcon icon={faSearch} />
                </button>
                <button onClick={handleReplace} title="Replace">
                  <FontAwesomeIcon icon={faExchangeAlt} />
                </button>
                <div className={styles.menuGroupLabel}>Editing</div>
              </div>
            </div>
          )}

          <EditorContent editor={editor} className={styles.editor} />

          {/* Save and Export Buttons */}
          <div className={styles.actionButtons}>
            <button onClick={handleSaveArticle} title="Save Article">
              <FontAwesomeIcon icon={faSave} /> บันทึกบทความ
            </button>
            <button onClick={handleExportJson} title="Export as JSON">
              <FontAwesomeIcon icon={faFileExport} /> Export JSON
            </button>
            <button onClick={handleExportPdf} title="Export as PDF">
              <FontAwesomeIcon icon={faFileExport} /> Export PDF
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
