import 'package:equatable/equatable.dart';

abstract class NotificationsEvent extends Equatable {
  const NotificationsEvent();
  @override
  List<Object?> get props => [];
}

class NotificationsLoadRequested extends NotificationsEvent {}

class NotificationMarkReadRequested extends NotificationsEvent {
  final String id;
  const NotificationMarkReadRequested(this.id);
  @override
  List<Object?> get props => [id];
}

class NotificationsMarkAllReadRequested extends NotificationsEvent {}

class NotificationDeleteRequested extends NotificationsEvent {
  final String id;
  const NotificationDeleteRequested(this.id);
  @override
  List<Object?> get props => [id];
}

class NotificationReceived extends NotificationsEvent {
  final Map<String, dynamic> data;
  const NotificationReceived(this.data);
  @override
  List<Object?> get props => [data];
}
