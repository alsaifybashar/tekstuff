
### Endpoint
`/api/auth/register`

When entering `-` in the `lastName` filed the endpoint tells that there is error in the format of the input. Similar problems can occur other files

**Error**:
```JSON
{
    "success": false,
    "message": "Validation failed",
    "errors": [
        {
            "field": "lastName",
            "message": "Last name must be 2-50 characters and contain only letters",
            "value": "Al-saify"
        }
    ]
}
```

