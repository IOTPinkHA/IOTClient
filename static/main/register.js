Validator({
    form: "#form-1",
    errorSelector: ".form-message",
    formGroupSelector: ".form-group",
    rules: [
      Validator.isRequired("#fullname", "Vui lòng nhập tên đầy đủ"),
      Validator.isEmail("#email", "Email không hợp lệ"),
      Validator.minLength("#password", 6),
      Validator.isConfirmed(
        "#password_confirmation",
        function () {
          return document.querySelector("#form-1 #password").value;
        },
        "Mật khẩu nhập lại không chính xác"
      ),
    ],
    onSubmit: function (formData) {
      fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Đăng kí tài khoản thành công')
          window.location.href = "/";
        } else {
          document.querySelector('.form-messages').innerText = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
        }
      })
      .catch(error => {
        console.error('Error:', error);
        document.querySelector('.form-messages').innerText = 'Đã có lỗi xảy ra. Vui lòng thử lại sau.';
      });
    }
  });
  