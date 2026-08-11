from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView


class RoleAwareTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Adds is_staff/is_superuser as extra claims on the access token -
    the minimum additional info the frontend needs to route a Normal
    User to /dashboard vs an Admin (Django superuser/staff) to /admin
    right after login, per the mentor's flow: "Backend checks Django
    permissions... If Superuser -> Admin Dashboard, Else -> BudgetBuddy
    Dashboard."

    Deliberately reuses SimpleJWT's own supported extension point
    (get_token()) rather than adding a new endpoint or response field -
    the /login/ response shape (access, refresh) is completely
    unchanged; only the *contents* of the already-existing access token
    payload gain two extra keys. The frontend's existing decodeToken()
    (context/AuthContext.jsx) already decodes this same payload
    locally to read user_id/exp, so it picks up these two extra claims
    for free, with no new API call and no change to the login flow
    itself.

    Deliberately does NOT use profile.role here even though
    Profile.Role.ADMIN exists (users/models.py) - that field is
    Occupation, not authorization (see RegisterSerializer's own
    comment on this same distinction), and profile.role is read-only
    everywhere in the API (ProfileSerializer.Meta.read_only_fields),
    so it can never be self-granted. is_staff/is_superuser are
    Django's own, are the actual authorization source of truth, and
    are what the mentor's spec explicitly asks for.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["is_staff"] = user.is_staff
        token["is_superuser"] = user.is_superuser
        return token


class RoleAwareTokenObtainPairView(TokenObtainPairView):
    serializer_class = RoleAwareTokenObtainPairSerializer
