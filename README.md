# Kotoba — frontend tách file, authentication qua API

## Xem giao diện

Mở `index.html`. Mặc định `assets/js/config.js` có `demo: true`: luyện với 4 từ mẫu, bỏ qua đăng nhập thật. CSS và JavaScript nằm trong `assets/`, không gộp vào HTML. Cần Internet để tải HTMX/font.

## Cấu trúc

- index.html: bố cục màn hình.
- assets/css/style.css: giao diện mobile first.
- assets/js/config.js: chỉ URL API và cờ demo.
- assets/js/auth.js: gọi API login/logout, giữ access token trong bộ nhớ.
- assets/js/app.js: điều phối UI và HTMX.
- assets/js/demo.js: dữ liệu và tương tác mẫu.
- supabase/functions/auth-api/index.ts: API xác thực phía server.
- supabase/functions/practice/: API trả fragment HTML cho HTMX.
- supabase/migrations/: schema và dữ liệu N4/N5.

## Authentication

Browser → POST /auth-api/login {username,password} → Edge Function → Supabase Auth.
API trả {access_token,expires_in}. Browser gửi Authorization: Bearer <token> khi gọi practice/logout. Không gửi Supabase API key từ client, không dùng Supabase SDK ở frontend. URL API vẫn là cấu hình public.

Password chỉ được gửi qua HTTPS tới API và không lưu. Token chỉ nằm trong bộ nhớ, không lưu localStorage/sessionStorage; refresh trang hoặc hết hạn phải đăng nhập lại. Chưa có chức năng refresh session hay quên mật khẩu. Token là thông tin xác thực của người dùng nên browser phải có nó để gọi API; nó không phải project key. Logout xóa token tại client và gọi Supabase logout; JWT đã phát hành có thể vẫn hợp lệ đến hết hạn, vì vậy đặt JWT expiry phù hợp trong Supabase.

Username ánh xạ ở SERVER thành username@kanji.invalid, lowercase, 3–32 ký tự chữ Latin/số/_. Tạo user trong Supabase Auth bằng email nội bộ này và password, xác nhận email bằng admin; tắt đăng ký công khai. Email nội bộ không nhận thư khôi phục mật khẩu.

## Deploy

1. Tạo Supabase project mới, bật Email/password, tắt public signup.
2. Từ thư mục dự án chạy:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
supabase secrets set ALLOWED_ORIGINS='https://YOUR_USERNAME.github.io,http://localhost:8000' USERNAME_DOMAIN='kanji.invalid'
supabase functions deploy auth-api
supabase functions deploy practice
```

SUPABASE_URL và SUPABASE_ANON_KEY được Edge Functions cung cấp trong môi trường server. Không chép key vào client. Origin không có path `/repository/` hoặc dấu `/` cuối.

`verify_jwt=false` cho auth-api để login/OPTIONS không cần token; endpoint logout kiểm tra qua Supabase Auth. Practice cũng cho OPTIONS đi qua và xác thực mọi POST bằng auth.getUser(). Database xác định quyền bằng auth.uid(), bật RLS, không cấp đọc trực tiếp đáp án.

3. Sửa assets/js/config.js:

```js
window.APP_CONFIG = {
  apiBaseUrl: 'https://YOUR_PROJECT_REF.supabase.co/functions/v1',
  demo: false,
};
```

4. Đưa index.html và assets/ lên GitHub Pages. Nếu dùng workflow, chỉ upload hai mục này (không cần publish supabase/). Tất cả đường dẫn assets đều tương đối nên chạy được dưới /repository/.
5. Test local bằng `python3 -m http.server 8000`, mở http://localhost:8000; dùng HTTPS khi deploy thật.

Luồng practice: POST /practice/random → nhập Hiragana → POST /practice/answer. Đúng thì hiện đáp án + nghĩa ngay; sai tối đa 3 lần rồi hiện. Giới hạn và idempotency được xử lý trong database, không phụ thuộc bộ đếm frontend.

## Kiểm chứng

Đã kiểm tra cú pháp JS, đường dẫn asset và không có Supabase SDK/project key trong frontend. Logic database/renderer kế thừa phiên bản đã kiểm tra local. Authentication mới chưa chạy end-to-end trên Supabase project thật; cần kiểm tra login đúng/sai, logout, CORS và hết hạn token sau deploy.
