import type { NextPageContext } from "next";
import Link from "next/link";

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F4F4F4",
        color: "#282C3F",
        fontFamily: "sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          background: "#FFFFFF",
          borderRadius: "8px",
          boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
          padding: "40px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            margin: "0 auto",
            borderRadius: "999px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FFF0F3",
            color: "#FF3F6C",
            fontWeight: 700,
            fontSize: "28px",
          }}
        >
          {statusCode || "!"}
        </div>
        <h1 style={{ marginTop: "20px", fontSize: "24px" }}>Something went wrong</h1>
        <p style={{ marginTop: "12px", color: "#535766", fontSize: "14px" }}>
          The page could not be loaded properly. Please try again or head back to the homepage.
        </p>
        <div style={{ marginTop: "24px" }}>
          <Link
            href="/"
            style={{
              display: "inline-block",
              background: "#FF3F6C",
              color: "#FFFFFF",
              padding: "12px 24px",
              borderRadius: "4px",
              fontSize: "14px",
              fontWeight: 600,
              textTransform: "uppercase",
              textDecoration: "none",
            }}
          >
            Go Home
          </Link>
        </div>
      </div>
    </main>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res?.statusCode ?? err?.statusCode ?? 500;
  return { statusCode };
};

export default ErrorPage;
