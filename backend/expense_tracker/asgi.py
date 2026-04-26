# # import os
# # from django.core.asgi import get_asgi_application

# # os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'expense_tracker.settings')
# # application = get_asgi_application()
# # </xai:function_call >

# # <xai:function_call name="create_file">
# # <parameter name="absolute_path">backend/accounts/__init__.py
# s = "abcabcdaba"
# max_s = ""
# for i in range(0,len(s)):
#     current_s =""
#     seen = set()
#     for j in range(i,len(s)):
#         if s[j] in seen:
#             break
#         seen.add(s[j])
#         current_s+=s[j]
#         if len(current_s)>len(max_s):
#             max_s = current_s
# print(max_s)

def fib(n):
    if n<=0:
        return 0
    if n==1:
        return 1
    return fib(n-1)+fib(n-2)

print(fib(6))
def fib_series(n):
    a,b=0,1
    for _ in range(n):
        a,b=b,a+b
    return a
print(fib_series(6))

