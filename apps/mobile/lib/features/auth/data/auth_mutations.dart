const loginMutation = r'''
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
''';

const registerMutation = r'''
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
        avatarUrl
      }
    }
  }
''';

const refreshTokenMutation = r'''
  mutation RefreshToken($token: String!) {
    refreshToken(token: $token) {
      accessToken
      refreshToken
      user {
        id
        email
        fullName
      }
    }
  }
''';

const logoutMutation = r'''
  mutation Logout($tokenId: String!) {
    logout(tokenId: $tokenId)
  }
''';
