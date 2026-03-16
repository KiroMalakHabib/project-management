import 'package:graphql_flutter/graphql_flutter.dart';
import 'package:gql/ast.dart';
import '../config/api_config.dart';
import '../storage/token_storage.dart';

class GraphQLClientFactory {
  static GraphQLClient create({required TokenStorage tokenStorage}) {
    final httpLink = HttpLink(ApiConfig.graphqlHttpUrl);

    final authLink = AuthLink(
      getToken: () async {
        // Proactively refresh if expired — keeps all requests authenticated
        final token = await tokenStorage.refreshIfNeeded();
        return token != null ? 'Bearer $token' : null;
      },
    );

    final wsLink = WebSocketLink(
      ApiConfig.graphqlWsUrl,
      config: SocketClientConfig(
        autoReconnect: true,
        inactivityTimeout: const Duration(seconds: 30),
        initialPayload: () async {
          final token = await tokenStorage.refreshIfNeeded();
          return token != null ? {'Authorization': 'Bearer $token'} : {};
        },
      ),
    );

    final link = Link.split(
      (request) {
        final definitions = request.operation.document.definitions;
        return definitions.any(
          (def) =>
              def is OperationDefinitionNode &&
              def.type == OperationType.subscription,
        );
      },
      wsLink,
      authLink.concat(httpLink),
    );

    return GraphQLClient(
      link: link,
      cache: GraphQLCache(store: InMemoryStore()),
    );
  }
}
