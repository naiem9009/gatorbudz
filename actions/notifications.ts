"use server"

interface NotificationDetails {
    name: String
    email: String
    date : Date
}

const notifications = (notification_data: NotificationDetails) => {

    const subject = `New account registered-${notification_data.email}`
}


export default notifications