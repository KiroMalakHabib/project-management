import 'package:bloc_test/bloc_test.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:project_management/features/notifications/domain/notifications_bloc.dart';
import 'package:project_management/features/notifications/domain/notifications_event.dart';
import 'package:project_management/features/notifications/domain/notifications_state.dart';
import 'package:project_management/features/notifications/domain/notification_item.dart';

class MockGraphQLClient extends Mock implements GraphQLClient {}

class FakeQueryOptions extends Fake implements QueryOptions {}
class FakeMutationOptions extends Fake implements MutationOptions {}

Map<String, dynamic> _notifJson({String id = 'n-1', bool isRead = false}) => {
      'id': id,
      'type': 'TASK_ASSIGNED',
      'title': 'Task assigned',
      'body': 'You have been assigned a task',
      'resourceId': 'task-1',
      'resourceType': 'Task',
      'isRead': isRead,
      'createdAt': '2026-01-01T10:00:00.000Z',
    };

NotificationItem _notifItem({String id = 'n-1', bool isRead = false}) =>
    NotificationItem.fromJson(_notifJson(id: id, isRead: isRead));

void main() {
  setUpAll(() {
    registerFallbackValue(FakeQueryOptions());
    registerFallbackValue(FakeMutationOptions());
  });

  late NotificationsBloc bloc;
  late MockGraphQLClient mockClient;

  setUp(() {
    mockClient = MockGraphQLClient();
    bloc = NotificationsBloc(client: mockClient);
  });

  tearDown(() => bloc.close());

  // ── NotificationsLoadRequested ────────────────────────────────────────────

  group('NotificationsLoadRequested', () {
    blocTest<NotificationsBloc, NotificationsState>(
      'emits [Loading, Loaded] with correct unread count',
      build: () {
        when(() => mockClient.query(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {
              'myNotifications': [
                _notifJson(id: 'n-1', isRead: false),
                _notifJson(id: 'n-2', isRead: true),
              ],
            },
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(NotificationsLoadRequested()),
      expect: () => [
        isA<NotificationsLoading>(),
        isA<NotificationsLoaded>()
            .having((s) => s.notifications.length, 'count', 2)
            .having((s) => s.unreadCount, 'unreadCount', 1),
      ],
    );

    blocTest<NotificationsBloc, NotificationsState>(
      'emits [Loading, Error] on failure',
      build: () {
        when(() => mockClient.query(any())).thenThrow(Exception('Network error'));
        return bloc;
      },
      act: (b) => b.add(NotificationsLoadRequested()),
      expect: () => [
        isA<NotificationsLoading>(),
        isA<NotificationsError>(),
      ],
    );
  });

  // ── NotificationMarkReadRequested ─────────────────────────────────────────

  group('NotificationMarkReadRequested', () {
    blocTest<NotificationsBloc, NotificationsState>(
      'optimistically marks notification as read and decrements unread count',
      seed: () => NotificationsLoaded(
        notifications: [_notifItem(id: 'n-1', isRead: false)],
        unreadCount: 1,
      ),
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {'markNotificationRead': {'id': 'n-1'}},
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const NotificationMarkReadRequested('n-1')),
      expect: () => [
        isA<NotificationsLoaded>()
            .having((s) => s.notifications.first.isRead, 'isRead', true)
            .having((s) => s.unreadCount, 'unreadCount', 0),
      ],
    );

    blocTest<NotificationsBloc, NotificationsState>(
      'does nothing when state is not NotificationsLoaded',
      build: () => bloc,
      act: (b) => b.add(const NotificationMarkReadRequested('n-1')),
      expect: () => [],
    );
  });

  // ── NotificationsMarkAllReadRequested ─────────────────────────────────────

  group('NotificationsMarkAllReadRequested', () {
    blocTest<NotificationsBloc, NotificationsState>(
      'marks all notifications as read and sets unreadCount to 0',
      seed: () => NotificationsLoaded(
        notifications: [
          _notifItem(id: 'n-1', isRead: false),
          _notifItem(id: 'n-2', isRead: false),
        ],
        unreadCount: 2,
      ),
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {'markAllNotificationsRead': true},
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(NotificationsMarkAllReadRequested()),
      expect: () => [
        isA<NotificationsLoaded>()
            .having((s) => s.unreadCount, 'unreadCount', 0)
            .having(
              (s) => s.notifications.every((n) => n.isRead),
              'all read',
              true,
            ),
      ],
    );
  });

  // ── NotificationDeleteRequested ───────────────────────────────────────────

  group('NotificationDeleteRequested', () {
    blocTest<NotificationsBloc, NotificationsState>(
      'removes notification from list',
      seed: () => NotificationsLoaded(
        notifications: [
          _notifItem(id: 'n-1', isRead: true),
          _notifItem(id: 'n-2', isRead: false),
        ],
        unreadCount: 1,
      ),
      build: () {
        when(() => mockClient.mutate(any())).thenAnswer(
          (_) async => QueryResult(
            options: QueryOptions(document: gql('')),
            data: {'deleteNotification': true},
            source: QueryResultSource.network,
          ),
        );
        return bloc;
      },
      act: (b) => b.add(const NotificationDeleteRequested('n-1')),
      expect: () => [
        isA<NotificationsLoaded>()
            .having((s) => s.notifications.length, 'count', 1)
            .having((s) => s.notifications.first.id, 'remaining id', 'n-2'),
      ],
    );
  });

  // ── NotificationReceived ──────────────────────────────────────────────────

  group('NotificationReceived', () {
    blocTest<NotificationsBloc, NotificationsState>(
      'prepends new notification and increments unread count',
      seed: () => NotificationsLoaded(
        notifications: [_notifItem(id: 'n-1', isRead: true)],
        unreadCount: 0,
      ),
      build: () => bloc,
      act: (b) => b.add(NotificationReceived(_notifJson(id: 'n-new', isRead: false))),
      expect: () => [
        isA<NotificationsLoaded>()
            .having((s) => s.notifications.length, 'count', 2)
            .having((s) => s.notifications.first.id, 'first is new', 'n-new')
            .having((s) => s.unreadCount, 'unreadCount', 1),
      ],
    );

    blocTest<NotificationsBloc, NotificationsState>(
      'does nothing when state is not NotificationsLoaded',
      build: () => bloc,
      act: (b) => b.add(NotificationReceived(_notifJson())),
      expect: () => [],
    );
  });
}
