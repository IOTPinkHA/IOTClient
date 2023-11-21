from flask import Flask, render_template, request, jsonify, url_for, redirect, session,flash
from flask_socketio import SocketIO
from flask_mqtt import Mqtt
from models.Model import db, Student, User, Course
import json
import pandas as pd
import os
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
app.config['SECRET'] = 'face-recognition-attendee'
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['MQTT_BROKER_URL'] = 'broker.mqttdashboard.com'
app.config['MQTT_BROKER_PORT'] = 1883
app.config['UPLOAD_FOLDER'] = os.path.join('csv', 'list_students')

app.secret_key = '123'

db.init_app(app)

arrivalStudents = []

with app.app_context():
    db.create_all()

mqtt = Mqtt(app)
socketio = SocketIO(app)


@app.route('/newpage')
def newpage():
    students = Student.query.all()
    return render_template('newpage.html', students=students)


@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        data = request.get_json()  # Nhận dữ liệu từ yêu cầu POST dưới dạng JSON
        fullname = data.get('fullname')
        email = data.get('email')
        password = data.get('password')
        password_confirmation = data.get('password_confirmation')
        if password == password_confirmation:
            # Thực hiện lưu thông tin vào cơ sở dữ liệu 
            new_user = User(fullname=fullname, email=email, password=password)
            db.session.add(new_user)
            db.session.commit()
            # Sau đó, chuyển hướng hoặc trả về JSON success: True
            return jsonify(success=True)
        else:
            return render_template('register.html', message='Mật khẩu và xác nhận mật khẩu không giống nhau.')

    return render_template('register.html')


@app.route('/', methods=['GET', 'POST'])
def login():
    message = 'Email hoặc mật khẩu không chính xác.'
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        # Thực hiện truy vấn SQL để kiểm tra email và mật khẩu trong cơ sở dữ liệu
        user = User.query.filter_by(email=email, password=password).first()

        if user:
            session['user'] = {'fullname': user.fullname, 'email': user.email}
            return redirect(url_for('index'))
        else:
            return render_template('login.html', message=message)
        
    # Nếu không phải yêu cầu POST, chuyển hướng hoặc hiển thị trang đăng nhập
    return render_template('login.html')


@app.route('/logout')
def logout():
    session.pop('user', None)  # Xóa phiên người dùng khỏi session
    return redirect(url_for('login'))  # Chuyển hướng đến trang đăng nhập


@app.route('/index', methods=['GET', 'POST'])
def index():
    user_info = session.get('user')

    if user_info:
        user = User.query.filter_by(email=user_info['email']).first()
        courses = Course.query.filter_by(user_id=user.id)

        if user:
            full_name, email = user.fullname, user.email
            return render_template('index.html', full_name=full_name, email=email, courses = courses)
    else:
        # Xử lý khi không có thông tin người dùng
        return redirect(url_for('login'))


@app.route('/add', methods=['GET', 'POST'])
def add():
    if request.method == 'POST':
        course_name = request.form['course_name']
        course_code = request.form['course_code']
        class_group = request.form['class_group']
        list_student_file = request.files.get('list_students')
        list_student_file.save(os.path.join(app.config['UPLOAD_FOLDER'], list_student_file.filename))

        user_info = session.get('user')
        if user_info:
            user = User.query.filter_by(email=user_info['email']).first()
            if user:
                new_course = Course(name=course_name, code=course_code, class_group=class_group, user_id=user.id)
                db.session.add(new_course)
                db.session.commit()

                last_course = Course.query.order_by(Course.id.desc()).first()
                print(last_course)
                file = open(os.path.join(app.config['UPLOAD_FOLDER'], list_student_file.filename), 'r', encoding='utf8')
                first_line = True
                for line in file:
                    if first_line:
                        first_line = False
                        continue
                    fields = line.split(',')
                    if len(fields) == 5:
                        new_student = Student(student_id=fields[0], name=fields[1], class_credits=fields[2],
                                              phone_number=fields[3], email=fields[4], course_id=last_course.id)
                        db.session.add(new_student)
                        db.session.commit()

                flash('lớp học đã được thêm thành công!', 'success')
                return redirect(url_for('index'))
    else:
        return render_template('add.html')

    
@app.route('/liststudent/<int:course_id>', methods=['GET', 'POST'])
def list_student(course_id):
    students = Student.query.filter_by(course_id=course_id).all()
    print(students)
    return render_template('listStudent.html', students=students)

###########################################################################################################


@mqtt.on_connect()
def handle_connect_mqtt(client, userdata, flags, rc):
    print('Connected to MQTT.')
    mqtt.subscribe('/face-recognition/attendee')


@mqtt.on_message()
def handle_message_mqtt(client, userdata, message):
    json_data = message.payload.decode('utf-8')
    payload = json.loads(json_data)
    print("Message receive from " + message.topic + ": " + message.payload.decode())
    data = dict(
        topic=message.topic,
        payload=payload
    )

    if len(arrivalStudents) == 0:
        arrivalStudents.append(payload)
    else:
        print(payload['userId'])
        userId = payload['userId']
        for s in arrivalStudents:
            if userId == s['userId']:
                return

    socketio.emit('mqtt_message', data=data)


@socketio.on('connect')
def handle_socket_connect():
    print('Somebody connected')
    socketio.emit('socket_message', data=arrivalStudents)


if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5001, use_reloader=False, allow_unsafe_werkzeug=True, debug=True)
