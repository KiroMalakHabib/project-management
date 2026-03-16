import 'package:equatable/equatable.dart';

class Organization extends Equatable {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? logoUrl;

  const Organization({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logoUrl,
  });

  factory Organization.fromJson(Map<String, dynamic> json) {
    return Organization(
      id: json['id'] as String,
      name: json['name'] as String,
      slug: json['slug'] as String,
      description: json['description'] as String?,
      logoUrl: json['logoUrl'] as String?,
    );
  }

  @override
  List<Object?> get props => [id, name, slug];
}
