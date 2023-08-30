﻿namespace SuperLaw.Services
{
    public interface IAuthService
    {
        Task<string> Login(string email, string password);
        Task<string> Register(string email, string password, string confirmPassword);
    }
}
