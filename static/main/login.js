Validator({
    form: "#form-2",
    errorSelector: ".form-message",
    formGroupSelector: ".form-group",
    rules: [
        Validator.isRequired("#email", "Vui lòng nhập email"),
        Validator.isEmail("#email", "Email không hợp lệ"),
        Validator.isRequired("#password", "Vui lòng nhập mật khẩu"),
        Validator.minLength("#password", 6, "Mật khẩu tối thiểu 6 kí tự")
    ],
});
