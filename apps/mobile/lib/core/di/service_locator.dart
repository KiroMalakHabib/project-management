import 'package:get_it/get_it.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../storage/token_storage.dart';
import '../graphql/graphql_client.dart';
import '../../features/auth/domain/auth_bloc.dart';
import '../../features/organizations/domain/organizations_bloc.dart';

final sl = GetIt.instance;

void setupServiceLocator() {
  // Storage
  sl.registerLazySingleton<TokenStorage>(() => TokenStorage());

  // GraphQL
  sl.registerLazySingleton<GraphQLClient>(
    () => GraphQLClientFactory.create(tokenStorage: sl<TokenStorage>()),
  );

  // BLoCs
  sl.registerFactory<AuthBloc>(
    () => AuthBloc(
      client: sl<GraphQLClient>(),
      tokenStorage: sl<TokenStorage>(),
    ),
  );

  sl.registerFactory<OrganizationsBloc>(
    () => OrganizationsBloc(client: sl<GraphQLClient>()),
  );
}
