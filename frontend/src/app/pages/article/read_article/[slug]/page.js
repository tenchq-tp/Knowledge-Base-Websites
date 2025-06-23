"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import Navbar from "../../../../component/Navbar";
import styles from "../../../../style/read_article.module.css";

// Tiptap
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

export default function ReadArticlePage() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editable: false,
  });

  useEffect(() => {
    const fetchArticle = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        Swal.fire({
          icon: "error",
          title: "Unauthorized",
          text: "Please login first.",
        });
        setError("No access token");
        setLoading(false);
        return;
      }

      try {
        const decodedSlug = decodeURIComponent(slug);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API}/articles/${decodedSlug}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              Accept: "application/json",
            },
          }
        );

        if (!res.ok) {
          const text = await res.text();
          let msg = "Failed to fetch article.";
          try {
            const json = JSON.parse(text);
            msg = json.message || json.detail || msg;
          } catch {}
          throw new Error(msg);
        }

        const data = await res.json();
        setArticle(data);
      } catch (err) {
        setError(err.message);
        Swal.fire({ icon: "error", title: "Error", text: err.message });
      } finally {
        setLoading(false);
      }
    };

    if (slug) fetchArticle();
  }, [slug]);

  // ⭐️ SET TIPTAP CONTENT เมื่อ article และ editor พร้อม
  useEffect(() => {
    if (!article || !editor || editor.isDestroyed) return;

    let content = article.content;

    if (typeof content === "string") {
      try {
        content = JSON.parse(content);
      } catch {
        content = {
          type: "doc",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: article.content }],
            },
          ],
        };
      }
    }

    editor.commands.setContent(content, false);
  }, [article, editor]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <p>Loading article...</p>
        </div>
      </>
    );
  }

  if (error || !article) {
    return (
      <>
        <Navbar />
        <div className={styles.container}>
          <p>Error: {error || "Article not found"}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className={styles.container}>
        <h1 className={styles.articleTitle}>{article.title}</h1>

        {/* Tags */}
        {article.tags?.length > 0 && (
          <div className={styles.tagsContainer}>
            <strong>Tags:</strong>{" "}
            {article.tags.map((tag, i) => (
              <span key={i} className={styles.tagItem}>
                {typeof tag === "object" ? tag.name : tag}
              </span>
            ))}
          </div>
        )}

        {/* Hashtags */}
        {article.hashtags?.length > 0 && (
          <div className={styles.hashtagsContainer}>
            <strong>Hashtags:</strong>{" "}
            {article.hashtags.map((tag, i) => (
              <span key={i} className={styles.hashtagItem}>
                {typeof tag === "object" ? tag.name : tag}
              </span>
            ))}
          </div>
        )}

        {/* Category / Subcategory */}
        {(article.category || article.subcategory) && (
          <div className={styles.categoryInfo}>
            {article.category && (
              <span>
                <strong>Category:</strong>{" "}
                {typeof article.category === "object"
                  ? article.category.name
                  : article.category}
              </span>
            )}
            {article.subcategory && (
              <span>
                <strong>Subcategory:</strong>{" "}
                {typeof article.subcategory === "object"
                  ? article.subcategory.name
                  : article.subcategory}
              </span>
            )}
          </div>
        )}

        {/* Dates */}
        {(article.start_date || article.end_date) && (
          <div className={styles.dateInfo}>
            {article.start_date && (
              <span>
                <strong>Start Date:</strong>{" "}
                {new Date(article.start_date).toLocaleString()}
              </span>
            )}
            {article.end_date && (
              <span>
                <strong>End Date:</strong>{" "}
                {new Date(article.end_date).toLocaleString()}
              </span>
            )}
          </div>
        )}

        {/* TIPTAP CONTENT */}
        <div className={styles.articleContent}>
          <EditorContent editor={editor} />
        </div>

        {/* Attached Files */}
        {article.attached_files?.length > 0 && (
          <div className={styles.attachedFiles}>
            <h3>Attached Files</h3>
            <ul>
              {article.attached_files.map((file, i) => (
                <li key={i}>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    {file.filename || file.url}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
