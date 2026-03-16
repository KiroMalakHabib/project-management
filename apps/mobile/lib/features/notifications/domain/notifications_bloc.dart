import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/notification_queries.dart';
import '../data/notification_mutations.dart';
import 'notifications_event.dart';
import 'notifications_state.dart';
import 'notification_item.dart';

class NotificationsBloc extends Bloc<NotificationsEvent, NotificationsState> {
  final GraphQLClient _client;

  NotificationsBloc({required GraphQLClient client})
      : _client = client,
        super(NotificationsInitial()) {
    on<NotificationsLoadRequested>(_onLoad);
    on<NotificationMarkReadRequested>(_onMarkRead);
    on<NotificationsMarkAllReadRequested>(_onMarkAllRead);
    on<NotificationDeleteRequested>(_onDelete);
    on<NotificationReceived>(_onReceived);
  }

  Future<void> _onLoad(
    NotificationsLoadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    emit(NotificationsLoading());
    try {
      final result = await _client.query(
        QueryOptions(
          document: gql(myNotificationsQuery),
          fetchPolicy: FetchPolicy.networkOnly,
        ),
      );
      if (result.hasException) throw Exception(result.exception.toString());

      final notifications = (result.data!['myNotifications'] as List)
          .map((n) => NotificationItem.fromJson(n as Map<String, dynamic>))
          .toList();
      final unreadCount = notifications.where((n) => !n.isRead).length;

      emit(NotificationsLoaded(notifications: notifications, unreadCount: unreadCount));
    } catch (e) {
      emit(NotificationsError(e.toString()));
    }
  }

  Future<void> _onMarkRead(
    NotificationMarkReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    if (state is! NotificationsLoaded) return;
    final current = state as NotificationsLoaded;

    await _client.mutate(MutationOptions(
      document: gql(markNotificationReadMutation),
      variables: {'id': event.id},
    ));

    final updated = current.notifications
        .map((n) => n.id == event.id ? n.copyWith(isRead: true) : n)
        .toList();
    emit(current.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    ));
  }

  Future<void> _onMarkAllRead(
    NotificationsMarkAllReadRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    if (state is! NotificationsLoaded) return;
    final current = state as NotificationsLoaded;

    await _client.mutate(MutationOptions(document: gql(markAllReadMutation)));

    final updated = current.notifications.map((n) => n.copyWith(isRead: true)).toList();
    emit(current.copyWith(notifications: updated, unreadCount: 0));
  }

  Future<void> _onDelete(
    NotificationDeleteRequested event,
    Emitter<NotificationsState> emit,
  ) async {
    if (state is! NotificationsLoaded) return;
    final current = state as NotificationsLoaded;

    await _client.mutate(MutationOptions(
      document: gql(deleteNotificationMutation),
      variables: {'id': event.id},
    ));

    final updated = current.notifications.where((n) => n.id != event.id).toList();
    emit(current.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    ));
  }

  Future<void> _onReceived(
    NotificationReceived event,
    Emitter<NotificationsState> emit,
  ) async {
    if (state is! NotificationsLoaded) return;
    final current = state as NotificationsLoaded;

    final newNotif = NotificationItem.fromJson(event.data);
    final updated = [newNotif, ...current.notifications];
    emit(current.copyWith(
      notifications: updated,
      unreadCount: updated.where((n) => !n.isRead).length,
    ));
  }
}
