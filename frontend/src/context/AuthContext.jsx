import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const USER_STORAGE_KEY = "nexserve_user";
const TOKEN_STORAGE_KEY = "nexserve_token";

const AuthContext = createContext(null);

// =====================================================
// STORAGE HELPERS
// =====================================================

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem(
      USER_STORAGE_KEY
    );

    if (!stored) {
      return null;
    }

    return JSON.parse(stored);
  } catch (error) {
    console.error(
      "Stored user parse error:",
      error
    );

    localStorage.removeItem(
      USER_STORAGE_KEY
    );

    return null;
  }
};

const getStoredToken = () => {
  try {
    return localStorage.getItem(
      TOKEN_STORAGE_KEY
    );
  } catch {
    return null;
  }
};

// =====================================================
// NORMALIZE USER
// =====================================================

const normalizeUser = (
  rawUser,
  fallbackRole = "customer"
) => {
  if (!rawUser) {
    return null;
  }

  const role =
    rawUser.role === "worker"
      ? "worker"
      : rawUser.role === "customer"
      ? "customer"
      : rawUser.role === "admin"
      ? "admin"
      : fallbackRole;

  return {
    ...rawUser,

    id:
      rawUser.id ||
      rawUser._id ||
      rawUser.userId ||
      null,

    _id:
      rawUser._id ||
      rawUser.id ||
      rawUser.userId ||
      null,

    name:
      rawUser.name ||
      rawUser.fullName ||
      "",

    email:
      rawUser.email || "",

    phone:
      rawUser.phone || "",

    city:
      rawUser.city || "",

    area:
      rawUser.area || "",

    skills: Array.isArray(
      rawUser.skills
    )
      ? rawUser.skills
      : [],

    experience:
      Number(
        rawUser.experience ?? 0
      ),

    location:
      rawUser.location &&
      typeof rawUser.location ===
        "object"
        ? {
            ...rawUser.location,

            latitude:
              rawUser.location
                .latitude ??
              rawUser.location.lat ??
              null,

            longitude:
              rawUser.location
                .longitude ??
              rawUser.location.lng ??
              null,
          }
        : null,

    isAvailable:
      Boolean(
        rawUser.isAvailable
      ),

    completedJobs:
      Number(
        rawUser.completedJobs ?? 0
      ),

    acceptedJobs:
      Number(
        rawUser.acceptedJobs ?? 0
      ),

    rating:
      Number(
        rawUser.rating ?? 0
      ),

    role,
  };
};

// =====================================================
// AUTH PROVIDER
// =====================================================

export const AuthProvider = ({
  children,
}) => {
  const [user, setUserState] =
    useState(() =>
      getStoredUser()
    );

  const [token, setTokenState] =
    useState(() =>
      getStoredToken()
    );

  // ===================================================
  // SAVE USER
  // ===================================================

  const saveUser =
    useCallback(
      (nextUser) => {
        setUserState(nextUser);

        if (nextUser) {
          localStorage.setItem(
            USER_STORAGE_KEY,
            JSON.stringify(
              nextUser
            )
          );
        } else {
          localStorage.removeItem(
            USER_STORAGE_KEY
          );
        }
      },
      []
    );

  // ===================================================
  // SAVE TOKEN
  // ===================================================

  const saveToken =
    useCallback(
      (nextToken) => {
        setTokenState(
          nextToken
        );

        if (nextToken) {
          localStorage.setItem(
            TOKEN_STORAGE_KEY,
            nextToken
          );
        } else {
          localStorage.removeItem(
            TOKEN_STORAGE_KEY
          );
        }
      },
      []
    );

  // ===================================================
  // LOGIN
  // ===================================================

  const login =
    useCallback(
      async ({
        email,
        password,
        role = "customer",
      }) => {
        const normalizedRole =
          ["customer", "worker", "admin"].includes(role)
            ? role
            : "customer";

        const endpoint =
          `/auth/${normalizedRole}/login`;

        const response =
          await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify(
                {
                  email: String(
                    email || ""
                  )
                    .trim()
                    .toLowerCase(),

                  password:
                    String(
                      password ||
                        ""
                    ),
                }
              ),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              "Invalid email or password."
          );
        }

        const receivedToken =
          data?.token ||
          data?.accessToken;

        const rawUser =
          data?.worker ||
          data?.user ||
          data?.data;

        if (!receivedToken) {
          throw new Error(
            "Authentication token was not received from server."
          );
        }

        if (!rawUser) {
          throw new Error(
            "User information was not received from server."
          );
        }

        const normalizedUser =
          normalizeUser(
            rawUser,
            normalizedRole
          );

        // Save immediately so protected
        // pages can read them without
        // waiting for another render.
        saveToken(
          receivedToken
        );

        saveUser(
          normalizedUser
        );

        return {
          user:
            normalizedUser,

          token:
            receivedToken,
        };
      },
      [
        saveToken,
        saveUser,
      ]
    );

  // ===================================================
  // REGISTER
  // ===================================================

  const register =
    useCallback(
      async ({
        name,
        email,
        phone,
        password,
        city,
        area,
        role = "customer",
        skills = [],
        experience = 0,
        latitude = null,
        longitude = null,
      }) => {
        const normalizedRole =
          role === "worker"
            ? "worker"
            : "customer";

        const endpoint =
          normalizedRole ===
          "worker"
            ? "/auth/worker/register"
            : "/auth/customer/register";

        const body = {
          name: String(
            name || ""
          ).trim(),

          email: String(
            email || ""
          )
            .trim()
            .toLowerCase(),

          phone: String(
            phone || ""
          ).trim(),

          password:
            String(
              password || ""
            ),

          city: String(
            city || ""
          ).trim(),

          area: String(
            area || ""
          ).trim(),

          latitude:
            latitude !== null &&
            latitude !==
              undefined &&
            latitude !== ""
              ? Number(latitude)
              : null,

          longitude:
            longitude !== null &&
            longitude !==
              undefined &&
            longitude !== ""
              ? Number(longitude)
              : null,
        };

        if (
          normalizedRole ===
          "worker"
        ) {
          body.skills =
            Array.isArray(
              skills
            )
              ? skills
                  .map(
                    (skill) =>
                      String(
                        skill
                      ).trim()
                  )
                  .filter(Boolean)
              : String(
                  skills || ""
                )
                  .split(",")
                  .map(
                    (skill) =>
                      skill.trim()
                  )
                  .filter(Boolean);

          body.experience =
            Number(
              experience || 0
            );
        }

        const response =
          await fetch(
            `${API_BASE_URL}${endpoint}`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body:
                JSON.stringify(
                  body
                ),
            }
          );

        const data =
          await response
            .json()
            .catch(() => ({}));

        if (
          !response.ok ||
          data?.success === false
        ) {
          throw new Error(
            data?.message ||
              "Registration failed."
          );
        }

        const receivedToken =
          data?.token ||
          data?.accessToken;

        const rawUser =
          data?.worker ||
          data?.user ||
          data?.data;

        if (
          !receivedToken
        ) {
          throw new Error(
            "Registration successful but authentication token was not received."
          );
        }

        if (!rawUser) {
          throw new Error(
            "Registration successful but user information was not received."
          );
        }

        const normalizedUser =
          normalizeUser(
            rawUser,
            normalizedRole
          );

        saveToken(
          receivedToken
        );

        saveUser(
          normalizedUser
        );

        return {
          user:
            normalizedUser,

          token:
            receivedToken,
        };
      },
      [
        saveToken,
        saveUser,
      ]
    );

  // ===================================================
  // UPDATE USER
  // ===================================================

  const updateUser =
    useCallback(
      (updates = {}) => {
        setUserState(
          (previous) => {
            if (!previous) {
              return previous;
            }

            const nextUser = {
              ...previous,
              ...updates,
            };

            // Merge location instead
            // of accidentally replacing
            // only one coordinate.
            if (
              updates.location &&
              typeof updates.location ===
                "object"
            ) {
              nextUser.location = {
                ...(
                  previous.location ||
                  {}
                ),
                ...updates.location,
              };
            }

            localStorage.setItem(
              USER_STORAGE_KEY,
              JSON.stringify(
                nextUser
              )
            );

            return nextUser;
          }
        );
      },
      []
    );

  // ===================================================
  // UPDATE LOCATION LOCALLY
  // ===================================================

  const updateLocation =
    useCallback(
      (location) => {
        if (
          !location ||
          typeof location !==
            "object"
        ) {
          return;
        }

        updateUser({
          location: {
            latitude:
              location.latitude ??
              location.lat ??
              null,

            longitude:
              location.longitude ??
              location.lng ??
              null,

            ...location,
          },
        });
      },
      [updateUser]
    );

  // ===================================================
  // UPDATE AVAILABILITY LOCALLY
  // ===================================================

  const updateAvailability =
    useCallback(
      (isAvailable) => {
        updateUser({
          isAvailable:
            Boolean(
              isAvailable
            ),
        });
      },
      [updateUser]
    );

  // ===================================================
  // LOGOUT
  // ===================================================

  const logout =
    useCallback(() => {
      setUserState(null);
      setTokenState(null);

      localStorage.removeItem(
        USER_STORAGE_KEY
      );

      localStorage.removeItem(
        TOKEN_STORAGE_KEY
      );
    }, []);

  // ===================================================
  // AUTH STATE
  // ===================================================

  const isAuthenticated =
    Boolean(
      user && token
    );

  // ===================================================
  // CONTEXT VALUE
  // ===================================================

  const value =
    useMemo(
      () => ({
        user,
        token,

        isAuthenticated,

        login,
        register,
        logout,

        updateUser,
        updateLocation,
        updateAvailability,

        API_BASE_URL,
      }),
      [
        user,
        token,
        isAuthenticated,
        login,
        register,
        logout,
        updateUser,
        updateLocation,
        updateAvailability,
      ]
    );

  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =====================================================
// USE AUTH
// =====================================================

export const useAuth = () => {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
};

export default AuthContext;