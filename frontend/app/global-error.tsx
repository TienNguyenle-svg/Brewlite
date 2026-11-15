"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>Đã có lỗi xảy ra!</h2>
          <p style={{ color: 'red' }}>Chi tiết: {error.message}</p>
          <button onClick={() => reset()} style={{ padding: '10px 20px', marginTop: '20px' }}>
            Tải lại trang
          </button>
        </div>
      </body>
    </html>
  );
}