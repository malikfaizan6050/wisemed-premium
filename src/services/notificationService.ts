import "server-only";

import { createNotificationRecord,listNotificationRecords,markNotificationRead,type NotificationInput } from "@/repositories/notificationRepository";

export async function createNotification(input:NotificationInput){ return createNotificationRecord(input); }
export async function getNotifications(userId:string,limit:number){ const notifications=await listNotificationRecords(userId,limit);return { notifications,unreadCount:notifications.filter((item)=>!item.read).length }; }
export async function readNotification(id:string,userId:string){ return markNotificationRead(id,userId); }
