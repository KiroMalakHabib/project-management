import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import 'core/di/service_locator.dart';
import 'features/auth/domain/auth_bloc.dart';
import 'features/auth/domain/auth_event.dart';
import 'features/organizations/domain/organizations_bloc.dart';
import 'features/notifications/domain/notifications_bloc.dart';
import 'app/router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initHiveForFlutter();
  setupServiceLocator();
  runApp(const ProjectMgmtApp());
}

class ProjectMgmtApp extends StatefulWidget {
  const ProjectMgmtApp({super.key});

  @override
  State<ProjectMgmtApp> createState() => _ProjectMgmtAppState();
}

class _ProjectMgmtAppState extends State<ProjectMgmtApp> {
  late final AuthBloc _authBloc;
  late final dynamic router;

  @override
  void initState() {
    super.initState();
    _authBloc = sl<AuthBloc>();
    _authBloc.add(AuthCheckRequested());
    router = createRouter(_authBloc);
  }

  @override
  void dispose() {
    _authBloc.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider.value(value: _authBloc),
        BlocProvider(create: (_) => sl<OrganizationsBloc>()),
        BlocProvider(create: (_) => sl<NotificationsBloc>()),
      ],
      child: MaterialApp.router(
        title: 'ProjectMgmt',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF2563EB),
            brightness: Brightness.light,
          ),
          useMaterial3: true,
        ),
        routerConfig: router,
      ),
    );
  }
}
