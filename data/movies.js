const movies = [
  {
    id: 1,
    title: "Zombie Cưng Của Ba",
    englishTitle: "My Daughter is a Zombie",
    year: 2025,
    duration: "1h 54m",
    ageRating: "T13",
    genres: ["Chính Kịch", "Chiếu Rạp", "Gia Đình", "Hài", "Giả Tưởng"],
    description:
      'Cho Jung Seok hóa thân thành Lee Jung Hwan, một huấn luyện viên động vật đầy nhiệt huyết quyết tâm bảo vệ cô con gái tuổi teen bị nhiễm virus zombie bằng cách "thuần hóa" cô bé.',
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/5502c889dc364b62c997bab38fac0675d04865d1?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/34cf49d25576b505279f7255a3e5d41e86e8887f?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/ecdecdc65c5e2472d4d2a0a67017db94fad0e7c4?width=134",
  },
  {
    id: 2,
    title: "Thế Giới Không Lối Thoát",
    englishTitle: "Alice in Borderland",
    year: 2020,
    duration: "Tập 6",
    ageRating: "T18",
    imdbRating: 7.8,
    season: "Phần 3",
    genres: [
      "Chính Kịch",
      "Hành Động",
      "Bí Ẩn",
      "Tâm Lý",
      "Chuyển Thể",
      "Giả Tưởng",
    ],
    description:
      "Một game thủ lông bông cùng hai người bạn nhận ra họ đã lọt vào thế giới Tokyo song song, nơi họ buộc phải thi đấu trong một loạt trò chơi tàn bạo để tồn tại.",
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/fb1a055542df429929cf8edb060204a3551bd569?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/2076232f0033e16c3249907b92566eb24d5d63b6?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/180cf59e792091df01c2c79f65b1ef50bb2fde2d?width=127",
  },
  {
    id: 3,
    title: "Bộ Tứ Siêu Đẳng: Bước Đi Đầu Tiên",
    englishTitle: "The Fantastic Four: First Steps",
    year: 2025,
    duration: "2h 10m",
    ageRating: "T13",
    quality: "4K",
    genres: [
      "Chiếu Rạp",
      "Siêu Anh Hùng",
      "Marvel",
      "Khoa Học",
      "Kỳ Ảo",
      "Phiêu Lưu",
    ],
    description:
      "The Fantastic Four: First Steps (Bộ Tứ Siêu Đẳng: Bước Đi Đầu Tiên) kể về một gia đình của Marvel đối mặt với thử thách khó khăn, họ vừa phải cân bằng vai trò là anh hùng với sức mạnh của mối quan hệ gia đình, vừa phải bảo vệ Trái đất khỏi một vị thần.",
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/fd0abf9e4776327233ed770985c4b33a0d83b574?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/08903c19cf524842fcab3ec722d13f8f3e3f544f?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/3465337a701d23eb293eabb8f53df4958e909730?width=127",
  },
  {
    id: 4,
    title: "Ám Ảnh Kinh Hoàng: Nghi Lễ Cuối Cùng",
    englishTitle: "The Conjuring: Last Rites",
    year: 2025,
    duration: "1h 50m",
    ageRating: "T18",
    quality: "CAM",
    genres: ["Chiếu Rạp", "Kinh Dị", "Tâm Lý", "Giả Tưởng"],
    description:
      "Đến với hồi kết của vũ trụ The Conjuring, The Conjuring: Nghi Lễ Cuối Cùng theo chân cặp đôi trừ tà Ed và Lorraine Warren đối mặt với một thế lực ác quỷ, kẻ đã reo rắc nỗi kinh hoàng cho gia đình Smurl trong suốt hơn một thập kỷ.",
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/1aba76624db150f7cced5c65aa94b7e1ee2248d1?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/7c611487dde1377dc173d18638027644457dddee?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/e9ce9782a1b3d4cb6da64324070d5204a1c7afe9?width=127",
  },
  {
    id: 5,
    title: "Em Xinh Tinh Quái",
    englishTitle: "Pretty Crazy",
    year: 2025,
    duration: "1h 53m",
    ageRating: "T13",
    genres: ["Chiếu Rạp", "Bí Ẩn", "Hài", "Lãng Mạn"],
    description:
      "Cô ấy hóa quỷ khi trời rạng sáng! Gil Gu (Ahn Bo Hyun) – một chàng trai trẻ thất nghiệp, sống vật vờ trong căn hộ nhỏ sau khi từ bỏ công việc, bất ngờ bị cuốn hút bởi Sun Ji (Im Yoon Ah), cô hàng xóm xinh đẹp vừa chuyển đến tầng dưới.",
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/efc58f4dcf67ebc9fa080bb59ad96dc0b3276f18?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/0c31033b6026c65b7f56467596fc4939043ac005?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/0f082b4464d32c384d3d3ccb7bdfb35d09f7454f?width=127",
  },
  {
    id: 6,
    title: "Ngày Thứ Sáu Siêu Kỳ Quái",
    englishTitle: "Freakier Friday",
    year: 2025,
    duration: "1h 51m",
    ageRating: "T13",
    genres: ["Chiếu Rạp", "Gia Đình", "Hài", "Kỳ Ảo", "Viễn Tưởng"],
    description:
      "Sau 22 năm, phim teen đình đám một thời “Freaky Friday” sẵn sàng trở lại với phần tiếp theo mang tên “Freakier Friday”. Giờ đây Anna đã trở thành một người mẹ, cô có một cô con gái tên Harper. Anna cũng có một cô con gái là con riêng của chồng, tên Lily.",
    posterImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/e2889c1dcb6335ef0a86fc34d4d20c341899bae6?width=1000",
    backgroundImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/ebc5bf78758b85ce6bd9333642626ffb5aebfb6a?width=3024",
    thumbnailImage:
      "https://api.builder.io/api/v1/image/assets/TEMP/44f7b32507a2562d060be3f455a71623faa10a55?width=127",
  },
];

export default movies;
