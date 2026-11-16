# Kotoba frontend

Frontend HTML/CSS/JavaScript dùng hai Edge Function public:

```text
GET https://pwypdvswtzjqsqxkqizu.supabase.co/functions/v1/random-kanji?type=minna%201
POST https://pwypdvswtzjqsqxkqizu.supabase.co/functions/v1/check-reading
```

Người học chọn Minna 1 hoặc Minna 2, bấm “Từ ngẫu nhiên”, rồi có tối đa ba lần nhập cách đọc bằng Hiragana. Mỗi lần bấm “Kiểm tra”, FE gửi `{type, kanji, input}` tới `check-reading`. Trả lời đúng sẽ hiện đáp án và nút “Tiếp tục”; sai ba lần sẽ hiện nút “Hiển thị đáp án”, sau đó mới hiện nút “Tiếp tục”.

```json
{"data":{"kanji":"書きます","read":"かきます"}}
```

Chạy local bằng `python3 -m http.server 8000`, sau đó mở `http://localhost:8000`.

