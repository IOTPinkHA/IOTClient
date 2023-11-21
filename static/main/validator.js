function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    }



    var selectorRules = {};

    function validate(inputElement, rule) {
        var errorMassage;
        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        // Lặp qua từng rules và kiểm tra 
        // Nấu có lỗi thì dừng việc kiểm tra
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMassage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMassage = rules[i](inputElement.value);
            }

            if (errorMassage) break;
        }


        if (errorMassage) {
            errorElement.innerText = errorMassage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerText = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }

        return !errorMassage;
        // console.log(!errorMassage);
    }


    var formElement = document.querySelector(options.form);
    if (formElement) {
        //Khi submit form
        formElement.onsubmit = function (e) {
            e.preventDefault();

            var isFormValid = true;
            //Thực hiện lặp qua từng rules và validate
            options.rules.forEach(function (rule) {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });


            if (isFormValid) {
                // console.log('Không có lỗi');
                //Trường hợp submit với javascript
                if (typeof options.onSubmit === 'function') {

                    var enableInputs = formElement.querySelectorAll('[name]');
                    var formValue = Array.from(enableInputs).reduce(function (values, input) {

                        switch (input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if (!input.matches(':checked')) {
                                    values[input.name] = [];
                                    return values;
                                }
                                if (!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default:
                                values[input.name] = input.value;
                        }


                        return values;
                    }, {});

                    options.onSubmit(formValue);

                }
                // submit với hành vi mặc định
                else {
                    formElement.submit();
                }
            }
        }



        // Lặp qua mỗi rules và xử lí (lắng nghe sự kiện blur, input,...)
        options.rules.forEach(function (rule) {

            //Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);
            Array.from(inputElements).forEach(function (inputElement) {
                if (inputElement) {

                    inputElement.onblur = function () {
                        validate(inputElement, rule);
                    }

                    inputElement.oninput = function () {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerText = '';
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                    }
                }
            });


        });

    }
}

Validator.isRequired = function (selector, massage) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : massage || 'Nhập vào trường này';
        }
    };
}

Validator.isEmail = function (selector, massage) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : massage || 'Nhập vào trường này';
        }
    };
}

Validator.minLength = function (selector, min, massage) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : massage || `Mật khẩu trường này tối đa ${min} kí tự`;
        }
    }
}

Validator.isConfirmed = function (selector, getComfirmValue, massage) {
    return {
        selector: selector,
        test: function (value) {
            return value === getComfirmValue() ? undefined : massage || 'Giá trị nhập vào không chính xác';
        }
    }
}






