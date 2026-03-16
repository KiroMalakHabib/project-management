import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:graphql_flutter/graphql_flutter.dart';
import '../data/organization_queries.dart';
import '../data/organization_mutations.dart';
import 'organizations_event.dart';
import 'organizations_state.dart';
import 'organization.dart';

class OrganizationsBloc extends Bloc<OrganizationsEvent, OrganizationsState> {
  final GraphQLClient _client;

  OrganizationsBloc({required GraphQLClient client})
      : _client = client,
        super(OrganizationsInitial()) {
    on<OrganizationsLoadRequested>(_onLoad);
    on<OrganizationCreateRequested>(_onCreate);
  }

  Future<void> _onLoad(
    OrganizationsLoadRequested event,
    Emitter<OrganizationsState> emit,
  ) async {
    emit(OrganizationsLoading());
    try {
      final result = await _client.query(
        QueryOptions(document: gql(myOrganizationsQuery), fetchPolicy: FetchPolicy.networkOnly),
      );
      if (result.hasException) throw Exception(result.exception.toString());

      final list = (result.data!['myOrganizations'] as List)
          .map((e) => Organization.fromJson(e as Map<String, dynamic>))
          .toList();
      emit(OrganizationsLoaded(list));
    } catch (e) {
      emit(OrganizationsError(e.toString()));
    }
  }

  Future<void> _onCreate(
    OrganizationCreateRequested event,
    Emitter<OrganizationsState> emit,
  ) async {
    try {
      final result = await _client.mutate(
        MutationOptions(
          document: gql(createOrganizationMutation),
          variables: {
            'input': {
              'name': event.name,
              'slug': event.slug,
              if (event.description != null) 'description': event.description,
            },
          },
        ),
      );
      if (result.hasException) throw Exception(result.exception.toString());
      // Reload list after creation
      add(OrganizationsLoadRequested());
    } catch (e) {
      emit(OrganizationsError(e.toString()));
    }
  }
}
