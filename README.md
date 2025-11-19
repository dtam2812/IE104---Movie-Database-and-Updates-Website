# [IE104.Q11.CNVN.Group2]--- ĐỒ ÁN XÂY DỰNG WEBSITE GIỚI THIỆU VÀ CẬP NHẬT PHIM UIT FILM.

* Trường Đại học Công nghệ Thông tin, Đại học Quốc gia Thành phố Hồ Chí Minh (ĐHQG-HCM)
* Khoa: Khoa học và Kỹ thuật thông tin (KH&KTTT)
* GVHD: ThS. Võ Tấn Khoa
* Nhóm sinh viên thực hiện: Nhóm 2

## Danh sách thành viên
|STT | Họ tên | MSSV|Chức vụ|
|:---:|:-------------:|:-----:|:-----:|
|1. 	| Đinh Nguyễn Đức Tâm | 23521384| Nhóm trưởng |
|2. 	| Trần Thành Vinh		| 23521799 | Thành viên |
|3. 	| Đỗ Tấn Tường		|	23521749| Thành viên |
|4.  | Nguyễn Phước Thịnh | 23521505| Thành viên |
|5. 	| Đào Minh Thiện | 23521477| Thành viên |

## Giới thiệu
Trong thời buổi ngày nay, rất nhiều phim điện ảnh hay phim bộ được ra đời rất nhiều. Song Song với đó việc chọn được 1 bộ phim hay và ưng ý với mỗi người rất khó.

Vì vậy, nhóm quyết định chọn đề tài "Xây dựng website giới thiệu và cập nhật phim UIT FILM"

## Tính năng
|Tên tác nhân |	Mô tả tác nhân|
|:-------------:|:-----:|
|Unauthenticated User (Người dùng chưa xác thực) |	Người dùng chưa có tài khoản hoặc có tài khoản nhưng chưa đăng nhập. Người dùng này được quyền sử dụng các chức năng công khai của hệ thống.|
|Authenticated User (Người dùng đã xác thực) |	Người dùng có tài khoản và đã đăng nhập, có một số quyền hạn sử dụng trong hệ thống.|
|Admin | Là người dùng có quyền hạn cao nhất trong hệ thống. Quản trị viên có thể quản lý người dùng, quản lý thông tin phim, xem và cập nhật phim, cấu hình hệ thống và xem các báo cáo. Quản trị viên đảm bảo hoạt động chung của hệ thống, bảo mật, và có quyền cấp phép và phân quyền cho các tài khoản khác trong hệ thống.|

|	Tên chức năng	|	Tác nhân	| Hoàn thành |
|:-------------:|:-----:|:-----:|
||	1.Unauthenticated User Module	(Mô-đun Người dùng chưa xác thực)                   	||
|	Đăng ký tài khoản người dùng	|	Unauthenticated User 	| 100%|
|	Đăng nhập người dùng 	|	Unauthenticated User	| 100%|
|	Quên mật khẩu	|	Unauthenticated User 	| 100%|
|	Tìm kiếm phim	|	Unauthenticated User 	| 100%|
|	Xem danh sách phim	|	Unauthenticated User 	| 100%|
|	Xem chi tiết phim	|	Unauthenticated User 	| 100%|
|	Xem chi tiết diễn viên và phim diễn viên đó đã tham gia	|	Unauthenticated User 	| 100%|
|	Đề xuất phim hot	|	Unauthenticated User 	| 100%|
|	Đề xuất phim tương tự	|	Unauthenticated User 	| 100%|
|	Sử dụng bộ lọc	|	Unauthenticated User	| 0%|
|	Xem Trailer	|	Unauthenticated User	| 0%|
||	2.Authenticated User Module	 (Mô-đun Người dùng đã xác thực)                        	||
|	Xem thông tin cá nhân	|	Authentication User	| 100%|
|	Sửa thông tin cá nhân	|	Authentication User	| 100%|
|	Xem thông báo	|	Authentication User	| 100%|
|	Đổi mật khẩu	|	Authentication User	| 100%|
|	Đăng xuất	|	Authentication User	| 100%|
|	Đánh giá	|	Customer	| 100%|
|	Thêm phim yêu thích vào mục yêu thích	|	Customer	| 100%|
|	Xem lại phim yêu thích vào mục yêu thích	|	Customer	| 100%|
||	3.Admin Module (Mô-đun Quản trị viên)                   ||
|	Quản lý phim	|	Admin	| 100%|
|	Thêm phim	|	Admin	| 100%|
|	Xóa phim	|	Admin	| 100%|
|	Sửa thông tin phim	|	Admin	| 100%|
|	Quản lý người dùng	|	Admin	| 100%|
|	Thêm người dùng	|	Admin	| 100%|
|	Xóa người dùng	|	Admin	| 100%|
|	Sửa thông tin người dùng	|	Admin	| 100%|



## Công nghệ sử dụng
* [Node.js] - Xử lý API, Back-end
* [Express] - Framework nằm trên chức năng máy chủ web của NodeJS
* [MongoDB] - Hệ quản trị cơ sở dữ liệu quan hệ sử dụng để lưu trữ dữ liệu cho trang web
* [HTML-CSS-Javascript] - Bộ ba công nghệ web, hiện thức hóa giao diện